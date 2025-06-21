# Diopside - 白雪巴ファンサイト

白雪巴VTuberの配信アーカイブサイト

## 🎯 概要

Diopsideは、白雪巴VTuberの配信アーカイブを管理・閲覧するためのWebアプリケーションです。AWS上にサーバーレスアーキテクチャで構築されており、高い可用性とスケーラビリティを提供します。

## 📱 利用可能な画面

### 1. **ホーム画面** (`/`)
- メイン動画アーカイブ一覧表示
- 年別フィルタリング機能
- 無限スクロール/ページネーション
- レスポンシブなグリッドレイアウト

### 2. **タグ検索画面** (`/tags`)
- 階層タグによる動画探索
- 左サイドバーのタグツリー表示
- 選択タグによる動画フィルタリング
- ブレッドクラムナビゲーション

### 3. **神経衰弱ゲーム画面** (`/memory`)
- 動画サムネイルを使った記憶ゲーム
- ペア数設定（4/6/8/10ペア）
- ゲーム統計表示（手数・時間）
- 勝利画面とパフォーマンス表示

### 4. **ランダム動画画面** (`/random`)
- ランダム動画発見機能
- 表示数設定（1/3/5/10本）
- 表示履歴機能
- シャッフルボタンで新しい選択

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
- Moon (モノレポタスクランナー)

### セットアップ

```bash
# リポジトリのクローン
git clone https://github.com/tsuji-tomonori/diopside.git
cd diopside

# 依存関係のインストール
moon run web:install
moon run api:install
moon run infra:install

# AWS CDKのインストール
npm install -g aws-cdk

# CDK Bootstrap
moon run :bootstrap
```

### デプロイ

```bash
# インフラとアプリケーションの一括デプロイ
moon run :deploy-all
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
moon run web:dev

# バックエンド開発サーバー
moon run api:dev
```

### テストの実行

```bash
# 全テストの実行
moon run :test
moon run api:test
moon run web:test

# コード品質チェック
moon run :lint
moon run api:lint
```

## 📋 利用可能なコマンド

### インフラ関連
- `moon run :deploy` - インフラのデプロイ
- `moon run :synth` - CDKテンプレートの合成
- `moon run :diff` - 変更差分の確認
- `moon run :destroy` - スタックの削除

### 開発・テスト
- `moon run :lint` - コード品質チェック
- `moon run :test` - テストの実行
- `moon run :clean` - ビルド成果物のクリーンアップ

### 統合デプロイ
- `moon run :deploy-all` - インフラ・フロントエンド・バックエンドの一括デプロイ

## 🤝 コントリビューション

プロジェクトへの貢献を歓迎します！詳細は [コントリビューションガイド](./docs/contributing.md) をご覧ください。

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 📞 サポート

- **Issues**: [GitHub Issues](https://github.com/tsuji-tomonori/diopside/issues)
- **Discussions**: [GitHub Discussions](https://github.com/tsuji-tomonori/diopside/discussions)