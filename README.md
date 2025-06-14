# Diopside - 白雪巴ファンサイト

白雪巴VTuberの配信アーカイブサイト

## 🎯 概要

Diopsideは、白雪巴VTuberの配信アーカイブを管理・閲覧するためのWebアプリケーションです。AWS上にサーバーレスアーキテクチャで構築されており、高い可用性とスケーラビリティを提供します。

## 🏗️ アーキテクチャ

- **フロントエンド**: Next.js (React)
- **バックエンド**: FastAPI (Python) on AWS Lambda
- **データベース**: DynamoDB
- **ストレージ**: S3
- **CDN**: CloudFront
- **セキュリティ**: WAF v2
- **インフラ**: AWS CDK (Infrastructure as Code)

## 🚀 クイックスタート

### 前提条件

- Node.js 20.x以上
- Python 3.13以上
- AWS CLI
- Task (タスクランナー)

### セットアップ

```bash
# リポジトリのクローン
git clone https://github.com/tsuji-tomonori/diopside.git
cd diopside

# 依存関係のインストール
task frontend:install
cd infrastructure && uv sync --dev
cd ../backend && uv sync --dev

# AWS CDKのインストール
npm install -g aws-cdk

# CDK Bootstrap
task bootstrap
```

### デプロイ

```bash
# インフラとアプリケーションの一括デプロイ
task deploy-all
```

## 📚 ドキュメント

詳細なドキュメントは `docs/` ディレクトリにあります：

- [デプロイメントガイド](./docs/deployment.md) - デプロイ手順とベストプラクティス
- [アーキテクチャ設計](./docs/architecture.md) - システム設計と技術選択
- [コントリビューションガイド](./docs/contributing.md) - 開発への参加方法

## 🔧 開発

### 開発サーバーの起動

```bash
# フロントエンド開発サーバー
task frontend:dev

# バックエンド開発サーバー
task backend:dev
```

### テストの実行

```bash
# 全テストの実行
task test
task backend:test
task frontend:test

# コード品質チェック
task lint
task backend:lint
```

## 📋 利用可能なコマンド

### インフラ関連
- `task deploy` - インフラのデプロイ
- `task synth` - CDKテンプレートの合成
- `task diff` - 変更差分の確認
- `task destroy` - スタックの削除

### 開発・テスト
- `task lint` - コード品質チェック
- `task test` - テストの実行
- `task clean` - ビルド成果物のクリーンアップ

### 統合デプロイ
- `task deploy-all` - インフラ・フロントエンド・バックエンドの一括デプロイ

## 🤝 コントリビューション

プロジェクトへの貢献を歓迎します！詳細は [コントリビューションガイド](./docs/contributing.md) をご覧ください。

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 📞 サポート

- **Issues**: [GitHub Issues](https://github.com/tsuji-tomonori/diopside/issues)
- **Discussions**: [GitHub Discussions](https://github.com/tsuji-tomonori/diopside/discussions)