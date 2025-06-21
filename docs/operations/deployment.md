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
- **統合環境**: 単一のスタックで全てのリソースを管理
- **自動デプロイ**: `main`ブランチから自動デプロイ

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
- **AWS CDK CLI** 2.149.0以上 (`npm install -g aws-cdk`)
- **Task** (タスクランナー)

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
- **WAF v2**: WebACL作成・更新

## 🏗️ インフラストラクチャのデプロイ

### 1. 環境のセットアップ

```bash
# 依存関係のインストール
task frontend:install

# インフラ依存関係のインストール
cd infrastructure && uv sync --dev

# バックエンド依存関係のインストール
cd ../backend && uv sync --dev

# AWS CDK のインストール（グローバル）
npm install -g aws-cdk

# CDK Bootstrap（初回のみ）
task bootstrap
```

### 2. デプロイ

```bash
# インフラのみデプロイ
task deploy

# フロントエンド・バックエンド含む全体デプロイ
task deploy-all
```

### 3. デプロイ前の確認

```bash
# 合成（テンプレート生成）のみ実行
task synth

# 差分確認
task diff

# スタック情報の確認
aws cloudformation describe-stacks --stack-name ShirayukiTomoFansiteStack

# リソースの確認
aws cloudformation list-stack-resources --stack-name ShirayukiTomoFansiteStack
```

## 🖥️ バックエンドのデプロイ

### 1. Lambda関数の準備

```bash
# バックエンドのテスト・品質チェック
task backend:lint
task backend:test
```

### 2. Lambda関数のデプロイ

Lambda関数は CDK デプロイ時に自動的にパッケージ化・デプロイされます。

```bash
# インフラデプロイ時に自動実行
task deploy
```

### 3. 環境変数の設定

Lambda関数の環境変数は CDK で自動設定されます：

```python
# infrastructure/stacks/constructs.py
environment={
    "DYNAMODB_TABLE_NAME": dynamodb_table.table_name,
    "S3_BUCKET_NAME": s3_bucket.bucket_name,
    "ENVIRONMENT": environment,
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
# フロントエンドの依存関係インストール
task frontend:install

# 環境変数の設定
cd frontend
cat > .env.local << EOF
NEXT_PUBLIC_API_BASE_URL=https://your-api-endpoint.execute-api.ap-northeast-1.amazonaws.com
NEXT_PUBLIC_SITE_NAME=白雪巴ファンサイト
NEXT_PUBLIC_SITE_DESCRIPTION=白雪巴VTuberの配信アーカイブサイト
EOF
```

### 2. 本番ビルドとデプロイ

```bash
# フロントエンドのビルドとデプロイ
task frontend:build

# または全体デプロイ
task deploy-all
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

2. **mainブランチへのマージ**
   - 本番環境への自動デプロイ
   - デプロイ後の動作確認

## 🔍 モニタリング・ログ

### CloudWatch ログ

```bash
# Lambda関数のログ確認
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/ShirayukiTomoFansite"

# ログストリームの確認
aws logs describe-log-streams --log-group-name "/aws/lambda/ShirayukiTomoFansite-FastAPIFunction"

# ログの取得
aws logs get-log-events --log-group-name "/aws/lambda/ShirayukiTomoFansite-FastAPIFunction" \
  --log-stream-name "latest-stream-name"
```

### メトリクス監視

```bash
# Lambda関数のメトリクス
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=ShirayukiTomoFansite-FastAPIFunction \
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
aws wafv2 list-web-acls --scope CLOUDFRONT --region ap-northeast-1

# WAF ルールの確認
aws wafv2 get-web-acl --scope CLOUDFRONT --id your-web-acl-id --region ap-northeast-1
```

### IAMロール・ポリシー

最小権限の原則に従ったIAMロールが自動作成されます：

- **Lambda実行ロール**: DynamoDB読み書き、S3読み取り、CloudWatch Logs書き込み
- **CloudFront OAC**: S3バケット読み取り専用

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. Lambda関数のタイムアウト
```bash
# CloudWatch Logsでエラー確認
aws logs filter-log-events \
  --log-group-name "/aws/lambda/ShirayukiTomoFansite-FastAPIFunction" \
  --filter-pattern "Task timed out"
```

#### 2. S3デプロイエラー
```bash
# バケットポリシーの確認
aws s3api get-bucket-policy --bucket your-bucket-name

# オブジェクトの確認
aws s3 ls s3://your-bucket-name/ --recursive
```

#### 3. CloudFront キャッシュ問題
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

1. **メモリ設定**: 256MB（パフォーマンス重視）
2. **タイムアウト**: 30秒
3. **レイヤー使用**: FastAPI等の依存関係をレイヤーに分離
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
task deploy --previous-parameters

# 特定のスタックの削除（緊急時）
task destroy
```

### アプリケーションのロールバック

```bash
# 前のバージョンのS3オブジェクトを復元
aws s3 sync s3://backup-bucket/previous-version/ s3://your-bucket-name/

# CloudFrontキャッシュの無効化
aws cloudfront create-invalidation --distribution-id your-distribution-id --paths "/*"
```

## 🗑️ 削除手順

スタックを削除する場合：

```bash
# スタックの削除
task destroy
```

**注意**: 削除前にデータのバックアップを取ることを強く推奨します。

## 📋 チェックリスト

### デプロイ前チェック

- [ ] 全テストが通過している
- [ ] コード品質チェックが通過している
- [ ] 環境変数が正しく設定されている
- [ ] AWS認証情報が設定されている
- [ ] 必要なAWS権限が付与されている
- [ ] CDK Bootstrap が完了している

### デプロイ後チェック

- [ ] インフラリソースが正常に作成されている
- [ ] API エンドポイントが応答している
- [ ] フロントエンドが正常に表示されている
- [ ] CloudWatch ログが出力されている
- [ ] メトリクスが正常に収集されている
- [ ] CloudFrontディストリビューションが正常に動作している

---

## 📞 サポート

デプロイメントに関する問題や質問は以下で受け付けています：

- **Issues**: [GitHub Issues](https://github.com/tsuji-tomonori/diopside/issues)
- **Discussions**: [GitHub Discussions](https://github.com/tsuji-tomonori/diopside/discussions)
- **AWS サポート**: 本番環境での問題については AWS サポートも活用してください

## 📚 関連ドキュメント

- [アーキテクチャ設計](./architecture.md)
- [コントリビューションガイド](./contributing.md)
- [バグ修正履歴](./BUGFIX_SUMMARY.md)
- [実装履歴](./IMPLEMENTATION_SUMMARY.md)
- [リファクタリング履歴](./REFACTOR_SUMMARY.md)

---

## 🔧 Taskfile コマンド一覧

### インフラ関連
- `task deploy` - インフラのデプロイ
- `task synth` - CDKテンプレートの合成
- `task diff` - 変更差分の確認
- `task destroy` - スタックの削除
- `task bootstrap` - CDK環境の初期化
- `task clean` - ビルド成果物のクリーンアップ

### 開発・テスト
- `task lint` - インフラコードの品質チェック
- `task test` - インフラテストの実行
- `task backend:lint` - バックエンドコードの品質チェック
- `task backend:test` - バックエンドテストの実行
- `task backend:dev` - バックエンド開発サーバーの起動

### フロントエンド
- `task frontend:install` - フロントエンド依存関係のインストール
- `task frontend:build` - フロントエンドのビルド
- `task frontend:dev` - フロントエンド開発サーバーの起動
- `task frontend:test` - フロントエンドテストの実行

### 統合デプロイ
- `task deploy-all` - インフラ・フロントエンド・バックエンドの一括デプロイ