# Troubleshooting Guide

## トラブルシューティングガイド

Diopsideシステムで発生する可能性のある問題とその解決方法を説明します。

## 一般的な問題診断フロー

```
問題発生
    ↓
CloudWatch Logs確認
    ↓
メトリクス確認
    ↓
X-Rayトレース確認
    ↓
問題の特定・解決
    ↓
再発防止策の実装
```

## フロントエンド関連の問題

### 1. ページが表示されない

#### 症状
- 白い画面が表示される
- 「サイトにアクセスできません」エラー

#### 診断手順
```bash
# CloudFront ディストリビューションの状態確認
aws cloudfront get-distribution --id E1234567890ABC

# S3 バケットの存在確認
aws s3 ls s3://your-bucket-name/

# CloudFront のエラー率確認
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name 4xxErrorRate \
  --dimensions Name=DistributionId,Value=E1234567890ABC \
  --start-time $(date -d "1 hour ago" --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Average
```

#### 解決方法
1. **S3 バケット確認**: オブジェクトが正しくアップロードされているか
2. **CloudFront 設定**: Origin Access Control (OAC) が正しく設定されているか
3. **DNS 設定**: カスタムドメインを使用している場合のRoute 53設定

### 2. API 呼び出しエラー

#### 症状
- 「データを取得できませんでした」
- CORS エラー
- 500 Internal Server Error

#### 診断手順
```bash
# API Gateway のエラー確認
aws logs filter-log-events \
  --log-group-name "API-Gateway-Execution-Logs_XXXXXXXXXX/prod" \
  --start-time $(date -d "1 hour ago" +%s)000 \
  --filter-pattern "ERROR"

# Lambda 関数のエラー確認
aws logs filter-log-events \
  --log-group-name "/aws/lambda/ShirayukiTomoFansite-FastAPIFunction" \
  --start-time $(date -d "1 hour ago" +%s)000 \
  --filter-pattern "ERROR"
```

#### 解決方法
1. **CORS 設定**: API Gateway でCORSが正しく設定されているか確認
2. **Lambda 関数**: エラーログから具体的な問題を特定
3. **DynamoDB**: テーブルへのアクセス権限確認

### 3. パフォーマンス問題

#### 症状
- ページ読み込みが遅い
- API レスポンスが遅い

#### 診断手順
```bash
# CloudFront のキャッシュヒット率確認
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name CacheHitRate \
  --dimensions Name=DistributionId,Value=E1234567890ABC \
  --start-time $(date -d "1 hour ago" --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Average

# Lambda 関数の実行時間確認
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=ShirayukiTomoFansite-FastAPIFunction \
  --start-time $(date -d "1 hour ago" --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Average,Maximum
```

#### 解決方法
1. **CloudFront キャッシュ**: キャッシュポリシーの最適化
2. **Lambda メモリ**: メモリ割り当ての調整
3. **DynamoDB**: インデックス設計の見直し

## バックエンド（Lambda）関連の問題

### 1. Lambda タイムアウト

#### 症状
- API 呼び出しが30秒でタイムアウト
- CloudWatch Logs に "Task timed out" エラー

#### 診断手順
```bash
# タイムアウトエラーの検索
aws logs filter-log-events \
  --log-group-name "/aws/lambda/ShirayukiTomoFansite-FastAPIFunction" \
  --filter-pattern "Task timed out"

# 実行時間の分析
aws logs filter-log-events \
  --log-group-name "/aws/lambda/ShirayukiTomoFansite-FastAPIFunction" \
  --filter-pattern "REPORT" | jq '.events[] | select(.message | contains("Duration:")) | .message'
```

#### 解決方法
1. **タイムアウト設定**: Lambda のタイムアウト値を増加
2. **コード最適化**: 処理時間の長い箇所を特定・最適化
3. **非同期処理**: 重い処理を非同期に変更

```python
# 修正例: タイムアウトを避けるための最適化
import asyncio
from concurrent.futures import ThreadPoolExecutor

async def optimized_data_processing(data_list):
    """並列処理でデータ処理を高速化"""
    with ThreadPoolExecutor(max_workers=4) as executor:
        loop = asyncio.get_event_loop()
        tasks = [
            loop.run_in_executor(executor, process_single_item, item)
            for item in data_list
        ]
        results = await asyncio.gather(*tasks)
    return results
```

### 2. メモリ不足エラー

#### 症状
- "Runtime exited with error: signal: killed" エラー
- メモリ使用量が上限に達する

#### 診断手順
```bash
# メモリ使用量の確認
aws logs filter-log-events \
  --log-group-name "/aws/lambda/ShirayukiTomoFansite-FastAPIFunction" \
  --filter-pattern "REPORT" | grep "Memory Size\|Max Memory Used"
```

#### 解決方法
1. **メモリ増加**: Lambda 関数のメモリ割り当てを増加
2. **メモリリーク**: 不要なオブジェクトの解放
3. **ストリーミング処理**: 大きなデータをストリーミングで処理

### 3. Cold Start 問題

#### 症状
- 初回リクエストが異常に遅い
- 断続的にレスポンスが遅くなる

#### 診断手順
```bash
# Cold Start の特定
aws logs filter-log-events \
  --log-group-name "/aws/lambda/ShirayukiTomoFansite-FastAPIFunction" \
  --filter-pattern "INIT_START"
```

#### 解決方法
1. **プロビジョニング済み同時実行**: 一定数のインスタンスを常に起動
2. **ウォームアップ**: 定期的にLambdaを実行してウォームアップ
3. **依存関係最適化**: 不要なライブラリの削除

```python
# 修正例: 接続の再利用
import boto3

# グローバル変数で接続を再利用
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['DYNAMODB_TABLE_NAME'])

def lambda_handler(event, context):
    # 接続はすでに確立済み
    response = table.query(...)
    return response
```

## データベース（DynamoDB）関連の問題

### 1. スロットリング（Throttling）

#### 症状
- "ProvisionedThroughputExceededException" エラー
- API レスポンスが異常に遅い

#### 診断手順
```bash
# スロットリングの確認
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ThrottledRequests \
  --dimensions Name=TableName,Value=ArchiveMetadata \
  --start-time $(date -d "1 hour ago" --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Sum

# 消費キャパシティの確認
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=ArchiveMetadata \
  --start-time $(date -d "1 hour ago" --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Sum
```

#### 解決方法
1. **オンデマンド課金**: プロビジョニング済みからオンデマンドに変更
2. **キャパシティ増加**: 読み取り/書き込みキャパシティを増加
3. **クエリ最適化**: 効率的なクエリパターンに変更

```python
# 修正例: バッチ処理でスループット向上
import boto3
from boto3.dynamodb.conditions import Key

def get_multiple_videos_efficiently(video_ids):
    """バッチリクエストで複数動画を効率的に取得"""
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('ArchiveMetadata')

    # BatchGetItem を使用
    response = dynamodb.batch_get_item(
        RequestItems={
            'ArchiveMetadata': {
                'Keys': [{'video_id': vid} for vid in video_ids]
            }
        }
    )
    return response['Responses']['ArchiveMetadata']
```

### 2. データ不整合

#### 症状
- 古いデータが返される
- データが見つからない

#### 診断手順
```bash
# 特定のアイテムの確認
aws dynamodb get-item \
  --table-name ArchiveMetadata \
  --key '{"video_id": {"S": "test123"}}'

# テーブルの状態確認
aws dynamodb describe-table --table-name ArchiveMetadata
```

#### 解決方法
1. **強い整合性**: Consistent Read の使用
2. **インデックス同期**: GSI の状態確認
3. **データ修復**: 不整合データの手動修正

## インフラ関連の問題

### 1. デプロイエラー

#### 症状
- CDK deploy が失敗する
- CloudFormation スタックエラー

#### 診断手順
```bash
# CloudFormation スタックイベントの確認
aws cloudformation describe-stack-events \
  --stack-name ShirayukiTomoFansiteStack

# CDK の差分確認
cd infrastructure
uv run cdk diff ShirayukiTomoFansiteStack
```

#### 解決方法
1. **IAM権限**: 必要な権限が付与されているか確認
2. **リソース制限**: AWS アカウントの制限に達していないか確認
3. **依存関係**: リソース間の依存関係が正しいか確認

### 2. WAF ブロック

#### 症状
- 正常なリクエストが403エラー
- 特定の地域からアクセスできない

#### 診断手順
```bash
# WAF ログの確認
aws logs filter-log-events \
  --log-group-name "aws-waf-logs-cloudfront-diopside" \
  --filter-pattern "{ $.action = \"BLOCK\" }"

# WAF WebACL の設定確認
aws wafv2 get-web-acl \
  --scope CLOUDFRONT \
  --id your-web-acl-id \
  --region us-east-1
```

#### 解決方法
1. **WAF ルール**: ブロックルールの見直し
2. **IP許可リスト**: 必要なIPアドレスの許可
3. **地理的制限**: 地域ブロックの設定確認

## 監視・アラート関連の問題

### 1. アラートが発火しない

#### 症状
- システム障害時にアラートが来ない
- メトリクスが正しく表示されない

#### 診断手順
```bash
# CloudWatch アラームの状態確認
aws cloudwatch describe-alarms \
  --alarm-names "LambdaErrorAlarm"

# SNS トピックの確認
aws sns list-subscriptions-by-topic \
  --topic-arn arn:aws:sns:region:account:topic-name
```

#### 解決方法
1. **アラーム設定**: 閾値と評価期間の見直し
2. **SNS設定**: サブスクリプション設定の確認
3. **IAM権限**: CloudWatch からSNSへの権限確認

### 2. 誤検知アラート

#### 症状
- 正常動作時にアラートが頻発
- 不要なアラートが多い

#### 解決方法
1. **閾値調整**: 適切な閾値に調整
2. **評価期間**: より長い評価期間に変更
3. **フィルター**: 不要なケースをフィルター

## 緊急時対応手順

### 1. サービス全体停止

#### 対応手順
1. **影響範囲の特定**: どの機能が停止しているか確認
2. **根本原因の調査**: ログとメトリクスから原因特定
3. **一時的な回避策**: 可能であれば代替手段を提供
4. **修正の実装**: 根本的な解決策を実装
5. **動作確認**: 修正後の動作確認
6. **事後分析**: 再発防止策の検討

### 2. パフォーマンス劣化

#### 対応手順
1. **ボトルネックの特定**: X-Rayトレースで処理時間分析
2. **リソース使用率確認**: CPU、メモリ、ネットワーク使用率
3. **スケーリング**: 必要に応じてリソースの増強
4. **最適化**: コードレベルでの最適化実装

### 3. セキュリティインシデント

#### 対応手順
1. **インシデントの確認**: WAFログやCloudTrail確認
2. **影響範囲の特定**: どのリソースが影響を受けたか
3. **アクセス制御**: 必要に応じてアクセスを制限
4. **証拠保全**: ログとデータの保全
5. **復旧作業**: セキュアな状態への復旧
6. **報告**: 必要に応じて関係者への報告

## 予防保守

### 1. 定期的なヘルスチェック

```bash
#!/bin/bash
# daily-health-check.sh

echo "=== Daily Health Check $(date) ==="

# API エンドポイントの確認
curl -f https://your-api-endpoint/health || echo "API health check failed"

# CloudWatch メトリクスの確認
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=ShirayukiTomoFansite-FastAPIFunction \
  --start-time $(date -d "24 hours ago" --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 86400 \
  --statistics Sum \
  --query 'Datapoints[0].Sum'

# DynamoDB の状態確認
aws dynamodb describe-table \
  --table-name ArchiveMetadata \
  --query 'Table.TableStatus'

echo "=== Health Check Complete ==="
```

### 2. 容量計画

```python
# 月次の使用量分析
def analyze_monthly_usage():
    """月次の使用量を分析して容量計画を立てる"""

    # Lambda 実行回数の分析
    invocations = get_lambda_invocations_last_month()

    # DynamoDB 使用量の分析
    read_capacity = get_dynamodb_read_capacity_last_month()

    # 成長率の計算
    growth_rate = calculate_growth_rate(invocations)

    # 将来の使用量予測
    predicted_usage = predict_future_usage(invocations, growth_rate)

    return {
        "current_usage": invocations,
        "growth_rate": growth_rate,
        "predicted_usage": predicted_usage
    }
```

## 参考資料

### 有用なコマンド集

```bash
# よく使うAWS CLIコマンド
alias lambda-logs='aws logs tail /aws/lambda/ShirayukiTomoFansite-FastAPIFunction --follow'
alias api-logs='aws logs tail API-Gateway-Execution-Logs_XXXXXXXXXX/prod --follow'
alias cf-invalidate='aws cloudfront create-invalidation --distribution-id E1234567890ABC --paths "/*"'

# ログ検索用関数
search-logs() {
  aws logs filter-log-events \
    --log-group-name "/aws/lambda/ShirayukiTomoFansite-FastAPIFunction" \
    --start-time $(date -d "1 hour ago" +%s)000 \
    --filter-pattern "$1"
}
```

### エラーコード一覧

| エラーコード | 説明 | 対処法 |
|-------------|------|--------|
| 500 | Lambda 内部エラー | ログ確認、コード修正 |
| 502 | Lambda タイムアウト | タイムアウト増加、最適化 |
| 403 | WAF ブロック | WAF ルール確認 |
| 404 | リソース未発見 | ルーティング確認 |
| 429 | レート制限 | リクエスト頻度調整 |
