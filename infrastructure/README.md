# 白雪巴ファンサイト インフラストラクチャ

AWS CDKを使用した白雪巴VTuberファンサイトのサーバーレスインフラストラクチャです。

## アーキテクチャ概要

このプロジェクトは以下のAWSサービスを使用してサーバーレス構成を実現しています：

- **S3**: 静的ウェブホスティング・サムネイル格納
- **CloudFront**: CDN配信
- **API Gateway (HTTP API)**: Lambda呼び出しのフロントドア
- **Lambda**: FastAPIエンドポイント
- **DynamoDB**: アーカイブメタデータ管理
- **WAF**: 基本的なWeb攻撃対策
- **CloudWatch**: ロギング・モニタリング

## リソース設計

### S3バケット
- バージョニング有効化
- パブリックアクセスブロック設定
- ライフサイクルルールで古いログを自動削除

### DynamoDB テーブル
- テーブル名: `ArchiveMetadata-{environment}`
- 主キー: `PK` (例: `YEAR#2023`), ソートキー: `SK` (例: `VIDEO#<id>`)
- GSI: `ByTag` (PartitionKey: `Tag`, SortKey: `SK`)
- オンデマンドキャパシティ

### Lambda 関数
- Python 3.13 ランタイム
- メモリ: 128MB、タイムアウト: 30s
- 環境変数でテーブル名・バケット名を注入
- X-Ray トレース有効

## 環境

- **開発環境**: `dev`
- **本番環境**: `prod`

## セットアップ

### 前提条件

- Python 3.13+
- uv (パッケージマネージャー)
- AWS CLI設定済み
- AWS CDK CLI

### インストール

```bash
# 依存関係のインストール
uv sync --dev

# CDK CLI のインストール (未インストールの場合)
npm install -g aws-cdk
```

### デプロイ

詳細なデプロイ手順については、[デプロイメントガイド](../docs/deployment.md)を参照してください。

**クイックスタート**:

```bash
# CDK Bootstrap（初回のみ）
cdk bootstrap aws://<ACCOUNT_ID>/us-east-1
cdk bootstrap aws://<ACCOUNT_ID>/ap-northeast-1

# 開発環境へのデプロイ（WAFスタックが自動的に先にデプロイされます）
uv run cdk deploy ShirayukiTomoFansiteDevStack

# 本番環境へのデプロイ
uv run cdk deploy ShirayukiTomoFansiteProdStack
```

**重要**: WAFスタックは必ずus-east-1リージョンでデプロイされ、メインスタックより先に実行される必要があります。

### その他のCDKコマンド

```bash
# CloudFormationテンプレートの生成
cdk synth

# 差分の確認
cdk diff

# スタックの削除
cdk destroy ShirayukiTomoFansiteDevStack
```

## テスト

```bash
# テストの実行
uv run pytest

# カバレッジ付きテスト
uv run pytest --cov=stacks

# 型チェック
uv run mypy .

# コードフォーマット
uv run ruff format .

# リンター
uv run ruff check .
```

## プロジェクト構造

```
infrastructure/
├── app.py                 # CDKアプリケーションのエントリポイント
├── cdk.json              # CDK設定ファイル
├── pyproject.toml        # Python依存関係とツール設定
├── stacks/               # CDKスタック定義
│   ├── __init__.py
│   ├── base_stack.py     # 共通インフラコンポーネント
│   ├── dev_stack.py      # 開発環境スタック
│   ├── prod_stack.py     # 本番環境スタック
│   └── waf_stack.py      # WAFスタック（us-east-1専用）
└── tests/                # テストファイル
    ├── __init__.py
    └── test_*.py
```

## タグ付けガイドライン

すべてのリソースには以下のタグが自動的に付与されます：

- `Project`: `shirayuki-tomo-fansite`
- `Environment`: `dev` / `prod`
- `Owner`: `openhands`
- `Name`: リソースごとに自動付与

## セキュリティ

- IAMロールは最小権限の原則に従って設計
- S3バケットはパブリックアクセスをブロック
- CloudFrontでHTTPS強制
- WAFで基本的なWeb攻撃を防御

## モニタリング

- CloudWatch Logsでアプリケーションログを収集
- Lambda関数のメトリクス監視
- API Gatewayのアクセスログ有効

## トラブルシューティング

### よくある問題

1. **WAF関連エラー**: `No export named WebACLArn-dev found`
   - WAFスタックが先にデプロイされているか確認
   - us-east-1リージョンでWAFスタックがデプロイされているか確認
   
2. **CDK Bootstrap エラー**: Bootstrap stack version が古い
   - 最新のCDK CLIを使用して両方のリージョンでBootstrapを再実行
   
3. **デプロイエラー**: AWS認証情報が正しく設定されているか確認

4. **権限エラー**: IAMユーザーに必要な権限があるか確認

5. **リソース名の競合**: S3バケット名は全世界で一意である必要があります

詳細なトラブルシューティングについては、[デプロイメントガイド](../docs/deployment.md#-トラブルシューティング)を参照してください。

### ログの確認

```bash
# Lambda関数のログ
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/ShirayukiTomoFansite"

# API Gatewayのログ
aws logs describe-log-groups --log-group-name-prefix "/aws/apigateway"
```

## 貢献

1. フィーチャーブランチを作成
2. 変更を実装
3. テストを実行
4. プルリクエストを作成

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。