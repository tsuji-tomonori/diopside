# デプロイメントガイド

白雪巴ファンサイト（Diopside）のデプロイメント手順とベストプラクティス

## 🎯 概要

このドキュメントでは、Diopsideプロジェクトの各コンポーネント（フロントエンド、バックエンド、インフラ）のデプロイメント手順を説明します。

## 🏗️ アーキテクチャ概要

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudFront    │────│   S3 Bucket      │    │   API Gateway   │
│   (CDN)         │    │   (Frontend)     │    │   (HTTP API)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                               │
         │                                               ▼
         │                                      ┌─────────────────┐
         │                                      │   Lambda        │
         │                                      │   (Backend)     │
         │                                      └─────────────────┘
         │                                               │
         ▼                                               ▼
┌─────────────────┐                            ┌─────────────────┐
│   WAF v2        │                            │   DynamoDB      │
│   (Protection)  │                            │   (Database)    │
└─────────────────┘                            └─────────────────┘
```

## 🚀 デプロイメント戦略

### 環境構成
- **開発環境 (dev)**: `develop`ブランチから自動デプロイ
- **本番環境 (prod)**: `main`ブランチから自動デプロイ

### デプロイメントフロー
1. **コード変更** → GitHub リポジトリにプッシュ
2. **CI/CD実行** → GitHub Actions による自動テスト・ビルド
3. **インフラデプロイ** → AWS CDK による Infrastructure as Code
4. **アプリケーションデプロイ** → Lambda関数・S3への自動デプロイ

### スタック依存関係

```
ShirayukiTomoFansiteDevWafStack (us-east-1)
    ↓
ShirayukiTomoFansiteDevStack (ap-northeast-1)

ShirayukiTomoFansiteProdWafStack (us-east-1)
    ↓
ShirayukiTomoFansiteProdStack (ap-northeast-1)
```

**重要**: WAFスタックは必ずus-east-1リージョンでデプロイし、メインスタックより先にデプロイする必要があります。

## 🔧 前提条件

### 必要なツール
- **AWS CLI** v2.x以上
- **Node.js** 20.x以上
- **Python** 3.13以上
- **uv** (Python パッケージマネージャー)
- **npm** 10.x以上
- **AWS CDK CLI** 2.149.0以上 (`npm install -g aws-cdk`)

### AWS アカウント設定
```bash
# AWS CLI の設定
aws configure
# または
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=ap-northeast-1
```

### 必要な権限
- **CloudFormation**: スタック作成・更新・削除
- **S3**: バケット作成・オブジェクト操作
- **Lambda**: 関数作成・更新・実行
- **DynamoDB**: テーブル作成・読み書き
- **CloudFront**: ディストリビューション作成・更新
- **API Gateway**: API作成・更新
- **IAM**: ロール・ポリシー作成
- **WAF v2**: WebACL作成・更新（us-east-1リージョン）

## 🏗️ インフラストラクチャのデプロイ

### 1. CDK環境のセットアップ

```bash
# インフラディレクトリに移動
cd infrastructure

# 依存関係のインストール
uv sync --dev

# AWS CDK のインストール（グローバル）
npm install -g aws-cdk

# CDK Bootstrap（初回のみ）
# WAF用（us-east-1）とメインリソース用（ap-northeast-1）の両方で実行
cdk bootstrap aws://<ACCOUNT_ID>/us-east-1
cdk bootstrap aws://<ACCOUNT_ID>/ap-northeast-1
```

**重要**: `<ACCOUNT_ID>` は実際のAWSアカウントIDに置き換えてください。

### 2. 開発環境のデプロイ

```bash
# WAFスタックのデプロイ（us-east-1）- 必ず最初に実行
uv run cdk deploy ShirayukiTomoFansiteDevWafStack

# メインスタックのデプロイ（ap-northeast-1）
uv run cdk deploy ShirayukiTomoFansiteDevStack

# または一括デプロイ（依存関係が自動解決される）
uv run cdk deploy ShirayukiTomoFansiteDevStack
```

### 3. 本番環境のデプロイ

```bash
# WAFスタックのデプロイ（us-east-1）
uv run cdk deploy ShirayukiTomoFansiteProdWafStack

# メインスタックのデプロイ（ap-northeast-1）
uv run cdk deploy ShirayukiTomoFansiteProdStack

# 承認が必要な変更の確認
uv run cdk deploy ShirayukiTomoFansiteProdStack --require-approval broadening
```

### 4. デプロイ前の確認

```bash
# 合成（テンプレート生成）のみ実行
uv run cdk synth

# 差分確認
uv run cdk diff ShirayukiTomoFansiteDevWafStack
uv run cdk diff ShirayukiTomoFansiteDevStack

# スタック情報の確認
aws cloudformation describe-stacks --stack-name ShirayukiTomoFansiteDevStack

# リソースの確認
aws cloudformation list-stack-resources --stack-name ShirayukiTomoFansiteDevStack
```

## 🖥️ バックエンドのデプロイ

### 1. Lambda関数の準備

```bash
cd backend

# 依存関係のインストール
uv sync

# テストの実行
uv run pytest

# コード品質チェック
uv run mypy app/
uv run ruff check app/
```

### 2. Lambda関数のデプロイ

Lambda関数は CDK デプロイ時に自動的にパッケージ化・デプロイされます。

```bash
# インフラデプロイ時に自動実行
cd ../infrastructure
uv run cdk deploy ShirayukiTomoFansiteDevStack
```

### 3. 環境変数の設定

Lambda関数の環境変数は CDK で自動設定されます：

```python
# infrastructure/stacks/base_stack.py
environment={
    "DYNAMODB_TABLE_NAME": self.dynamodb_table.table_name,
    "S3_BUCKET_NAME": self.s3_bucket.bucket_name,
    "ENVIRONMENT": self.env_name,
}
```

### 4. API エンドポイントの確認

```bash
# API Gateway エンドポイントの取得
aws apigatewayv2 get-apis --query 'Items[?Name==`shirayuki-tomo-fansite-api-dev`].ApiEndpoint'

# ヘルスチェック
curl https://your-api-endpoint.execute-api.ap-northeast-1.amazonaws.com/
```

## 🌐 フロントエンドのデプロイ

### 1. ビルドの準備

```bash
cd frontend

# 依存関係のインストール
npm install

# 環境変数の設定
cat > .env.local << EOF
NEXT_PUBLIC_API_BASE_URL=https://your-api-endpoint.execute-api.ap-northeast-1.amazonaws.com
NEXT_PUBLIC_SITE_NAME=白雪巴ファンサイト
NEXT_PUBLIC_SITE_DESCRIPTION=白雪巴VTuberの配信アーカイブサイト
EOF
```

### 2. 本番ビルド

```bash
# 本番用ビルド
npm run build

# 静的エクスポート（S3用）
npm run export
```

### 3. S3へのデプロイ

```bash
# S3バケット名の取得
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name ShirayukiTomoFansiteDevStack \
  --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
  --output text)

# ビルド成果物のアップロード
aws s3 sync out/ s3://$BUCKET_NAME/ --delete

# CloudFront キャッシュの無効化
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name ShirayukiTomoFansiteDevStack \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text)

aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

## 🔄 CI/CD パイプライン

### GitHub Actions 設定

CI/CDパイプラインは `.github/workflows/ci.yml` で定義されています。

### 必要なシークレット

GitHub リポジトリの Settings > Secrets で以下を設定：

```
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

### 自動デプロイフロー

1. **プルリクエスト作成**
   - 自動テスト実行
   - コード品質チェック
   - CDK差分確認

2. **developブランチへのマージ**
   - 開発環境への自動デプロイ
   - 統合テストの実行

3. **mainブランチへのマージ**
   - 本番環境への自動デプロイ
   - デプロイ後の動作確認

## 🔍 モニタリング・ログ

### CloudWatch ログ

```bash
# Lambda関数のログ確認
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/ShirayukiTomoFansite"

# ログストリームの確認
aws logs describe-log-streams --log-group-name "/aws/lambda/ShirayukiTomoFansite-dev-FastAPIFunction"

# ログの取得
aws logs get-log-events --log-group-name "/aws/lambda/ShirayukiTomoFansite-dev-FastAPIFunction" \
  --log-stream-name "latest-stream-name"
```

### メトリクス監視

```bash
# Lambda関数のメトリクス
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=ShirayukiTomoFansite-dev-FastAPIFunction \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Average
```

## 🛡️ セキュリティ

### SSL/TLS証明書

CloudFrontで自動的にSSL証明書が設定されます。

### WAF設定

```bash
# WAF WebACLの確認
aws wafv2 list-web-acls --scope CLOUDFRONT --region us-east-1

# WAF ルールの確認
aws wafv2 get-web-acl --scope CLOUDFRONT --id your-web-acl-id --region us-east-1
```

### IAMロール・ポリシー

最小権限の原則に従ったIAMロールが自動作成されます：

- **Lambda実行ロール**: DynamoDB読み書き、S3読み取り、CloudWatch Logs書き込み
- **CloudFront OAI**: S3バケット読み取り専用

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. WAF関連のエラー

**エラー**: `No export named WebACLArn-dev found. Rollback requested by user.`

**原因**: CloudFormationのエクスポート機能はクロスリージョンで動作しないため、WAFスタック（us-east-1）からメインスタック（ap-northeast-1）への参照が失敗する

**解決方法**: 
```bash
# 新しいSSMパラメータベースのアプローチを使用
# WAFスタックがSSMパラメータにWebACL ARNを保存し、
# メインスタックがSSMパラメータから読み取る

# WAFスタックを先にus-east-1でデプロイ
uv run cdk deploy ShirayukiTomoFansiteDevWafStack

# SSMパラメータの確認
aws ssm get-parameter --name "/shirayuki-tomo-fansite/dev/waf/webacl-arn" --region us-east-1

# メインスタックのデプロイ（SSMパラメータから自動取得）
uv run cdk deploy ShirayukiTomoFansiteDevStack
```

**技術的詳細**: 
- CloudFormationエクスポートはリージョン内でのみ動作
- SSMパラメータはクロスリージョンアクセスが可能
- WAFスタック: `/shirayuki-tomo-fansite/{env}/waf/webacl-arn` にARNを保存
- メインスタック: CloudFrontコンストラクトでSSMパラメータから読み取り

**エラー**: `The scope is not valid., field: SCOPE_VALUE, parameter: CLOUDFRONT`

**原因**: WAF WebACLがus-east-1以外のリージョンで作成されようとしている

**解決方法**: WAFスタックが正しくus-east-1で作成されていることを確認

#### 2. CDK Bootstrap エラー

**エラー**: Bootstrap stack version が古い（バージョン21未満）

**解決方法**: 
```bash
# 最新CDK CLIのインストール
npm install -g aws-cdk@latest

# Bootstrap の再実行（両方のリージョンで）
cdk bootstrap aws://167545301745/us-east-1 --force
cdk bootstrap aws://167545301745/ap-northeast-1 --force

# バージョン確認
cdk --version
```

#### 3. クロススタック参照エラー

**エラー**: `WebACLArn-dev` が見つからない

**原因**: 
- CloudFormationエクスポートはクロスリージョンで動作しない
- WAFスタック（us-east-1）とメインスタック（ap-northeast-1）が異なるリージョンにある
- 従来のCloudFormationエクスポート/インポート機能を使用している

**解決方法**: 
```bash
# 新しいSSMパラメータベースのアプローチを使用
# WAFスタックの状態確認
aws cloudformation describe-stacks --stack-name ShirayukiTomoFansiteDevWafStack --region us-east-1

# SSMパラメータの確認（新しいアプローチ）
aws ssm get-parameter --name "/shirayuki-tomo-fansite/dev/waf/webacl-arn" --region us-east-1

# WAFスタックの再デプロイ（SSMパラメータ対応版）
uv run cdk deploy ShirayukiTomoFansiteDevWafStack

# メインスタックのデプロイ（SSMパラメータから自動取得）
uv run cdk deploy ShirayukiTomoFansiteDevStack
```

**アーキテクチャの変更点**:
- **旧**: CloudFormationエクスポート → CloudFormationインポート（同一リージョンのみ）
- **新**: WAFスタック → SSMパラメータ → メインスタック（クロスリージョン対応）

#### 4. Lambda関数のタイムアウト
```bash
# CloudWatch Logsでエラー確認
aws logs filter-log-events \
  --log-group-name "/aws/lambda/ShirayukiTomoFansite-dev-FastAPIFunction" \
  --filter-pattern "Task timed out"
```

#### 5. S3デプロイエラー
```bash
# バケットポリシーの確認
aws s3api get-bucket-policy --bucket your-bucket-name

# オブジェクトの確認
aws s3 ls s3://your-bucket-name/ --recursive
```

#### 6. CloudFront キャッシュ問題
```bash
# キャッシュ無効化の確認
aws cloudfront list-invalidations --distribution-id your-distribution-id

# 新しい無効化の作成
aws cloudfront create-invalidation \
  --distribution-id your-distribution-id \
  --paths "/*"
```

## 📊 パフォーマンス最適化

### Lambda関数の最適化

1. **メモリ設定**: 128MB（コスト効率重視）
2. **タイムアウト**: 30秒
3. **同時実行数**: 予約同時実行数の設定
4. **プロビジョニング済み同時実行**: 必要に応じて設定

### CloudFront最適化

1. **キャッシュ設定**: 静的ファイルの長期キャッシュ
2. **圧縮**: Gzip/Brotli圧縮の有効化
3. **HTTP/2**: 自動有効化
4. **エッジロケーション**: グローバル配信

## 🔄 ロールバック手順

### インフラのロールバック

```bash
# 前のバージョンへのロールバック
uv run cdk deploy ShirayukiTomoFansiteDevStack --previous-parameters

# 特定のスタックの削除（緊急時）
uv run cdk destroy ShirayukiTomoFansiteDevStack
```

### アプリケーションのロールバック

```bash
# 前のバージョンのS3オブジェクトを復元
aws s3 sync s3://backup-bucket/previous-version/ s3://your-bucket-name/

# CloudFrontキャッシュの無効化
aws cloudfront create-invalidation --distribution-id your-distribution-id --paths "/*"
```

## 🗑️ 削除手順

スタックを削除する場合は、依存関係の逆順で削除してください：

```bash
# 開発環境の削除
uv run cdk destroy ShirayukiTomoFansiteDevStack
uv run cdk destroy ShirayukiTomoFansiteDevWafStack

# 本番環境の削除
uv run cdk destroy ShirayukiTomoFansiteProdStack
uv run cdk destroy ShirayukiTomoFansiteProdWafStack
```

**注意**: 削除前にデータのバックアップを取ることを強く推奨します。

## 📋 チェックリスト

### デプロイ前チェック

- [ ] 全テストが通過している
- [ ] コード品質チェックが通過している
- [ ] 環境変数が正しく設定されている
- [ ] AWS認証情報が設定されている
- [ ] 必要なAWS権限が付与されている
- [ ] CDK Bootstrap が両方のリージョンで完了している
- [ ] WAFスタックが先にデプロイされている（クロススタック参照の場合）

### デプロイ後チェック

- [ ] インフラリソースが正常に作成されている
- [ ] WAF WebACLが正しくエクスポートされている
- [ ] API エンドポイントが応答している
- [ ] フロントエンドが正常に表示されている
- [ ] CloudWatch ログが出力されている
- [ ] メトリクスが正常に収集されている
- [ ] CloudFrontディストリビューションが正常に動作している

### WAF関連チェック

- [ ] WAFスタックがus-east-1リージョンにデプロイされている
- [ ] WebACL ARNがSSMパラメータに正しく保存されている（`/shirayuki-tomo-fansite/{env}/waf/webacl-arn`）
- [ ] SSMパラメータがus-east-1リージョンで確認できる
- [ ] メインスタックでSSMパラメータからの読み取りが成功している
- [ ] CloudFrontディストリビューションにWAFが正しく関連付けられている

---

## 📞 サポート

デプロイメントに関する問題や質問は以下で受け付けています：

- **Issues**: [GitHub Issues](https://github.com/tsuji-tomonori/diopside/issues)
- **Discussions**: [GitHub Discussions](https://github.com/tsuji-tomonori/diopside/discussions)
- **AWS サポート**: 本番環境での問題については AWS サポートも活用してください