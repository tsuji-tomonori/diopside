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

## 🔧 前提条件

### 必要なツール
- **AWS CLI** v2.x以上
- **Node.js** 20.x以上
- **Python** 3.13以上
- **uv** (Python パッケージマネージャー)
- **npm** 10.x以上

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
uv run cdk bootstrap
```

### 2. 開発環境のデプロイ

```bash
# 開発環境スタックのデプロイ
uv run cdk deploy ShirayukiTomoFansiteDevStack

# デプロイ前の差分確認
uv run cdk diff ShirayukiTomoFansiteDevStack

# CloudFormation テンプレートの生成
uv run cdk synth ShirayukiTomoFansiteDevStack
```

### 3. 本番環境のデプロイ

```bash
# 本番環境スタックのデプロイ
uv run cdk deploy ShirayukiTomoFansiteProdStack

# 承認が必要な変更の確認
uv run cdk deploy ShirayukiTomoFansiteProdStack --require-approval broadening
```

### 4. デプロイ後の確認

```bash
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

#### 1. CDK Bootstrap エラー
```bash
# Bootstrap の再実行
uv run cdk bootstrap --force

# 特定のリージョンでのBootstrap
uv run cdk bootstrap aws://123456789012/ap-northeast-1
```

#### 2. Lambda関数のタイムアウト
```bash
# CloudWatch Logsでエラー確認
aws logs filter-log-events \
  --log-group-name "/aws/lambda/ShirayukiTomoFansite-dev-FastAPIFunction" \
  --filter-pattern "Task timed out"
```

#### 3. S3デプロイエラー
```bash
# バケットポリシーの確認
aws s3api get-bucket-policy --bucket your-bucket-name

# オブジェクトの確認
aws s3 ls s3://your-bucket-name/ --recursive
```

#### 4. CloudFront キャッシュ問題
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

## 📋 チェックリスト

### デプロイ前チェック

- [ ] 全テストが通過している
- [ ] コード品質チェックが通過している
- [ ] 環境変数が正しく設定されている
- [ ] AWS認証情報が設定されている
- [ ] 必要なAWS権限が付与されている

### デプロイ後チェック

- [ ] インフラリソースが正常に作成されている
- [ ] API エンドポイントが応答している
- [ ] フロントエンドが正常に表示されている
- [ ] CloudWatch ログが出力されている
- [ ] メトリクスが正常に収集されている

---

## 📞 サポート

デプロイメントに関する問題や質問は以下で受け付けています：

- **Issues**: [GitHub Issues](https://github.com/tsuji-tomonori/diopside/issues)
- **Discussions**: [GitHub Discussions](https://github.com/tsuji-tomonori/diopside/discussions)
- **AWS サポート**: 本番環境での問題については AWS サポートも活用してください