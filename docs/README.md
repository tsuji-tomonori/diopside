# 白雪巴ファンサイト (Diopside)

白雪巴（しらゆき ともえ）VTuberのファンサイト「Diopside」は、配信アーカイブの管理と検索機能を提供するWebアプリケーションです。

## 🎯 プロジェクト概要

### 主な機能
- **アーカイブ管理**: 配信動画のメタデータ管理
- **検索・フィルタリング**: タグベースでの高速検索
- **レスポンシブデザイン**: モバイル・デスクトップ対応
- **サーバーレス構成**: AWS上での完全サーバーレス運用

### 技術スタック

| 分野 | 技術 | バージョン |
|------|------|-----------|
| **フロントエンド** | Next.js | 15.x |
| | React | 19.x |
| | TypeScript | 5.x |
| | Tailwind CSS | 3.x |
| **バックエンド** | FastAPI | 0.115.x |
| | Python | 3.13 |
| | Pydantic | 2.x |
| **インフラ** | AWS CDK | 2.x |
| | AWS Lambda | Python 3.13 |
| | DynamoDB | - |
| | CloudFront | - |
| **開発ツール** | uv | latest |
| | pytest | - |
| | Jest | - |

## 🏗️ アーキテクチャ

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js       │────│   CloudFront     │────│   API Gateway   │
│   Frontend      │    │   CDN            │    │   HTTP API      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                │                        ▼
                                │               ┌─────────────────┐
                                │               │   Lambda        │
                                │               │   (FastAPI)     │
                                │               └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   S3 Bucket     │    │   DynamoDB      │
                       │   Static Web    │    │   Archive Data  │
                       └─────────────────┘    └─────────────────┘
```

## 🚀 クイックスタート

### 前提条件
- Node.js 20.x以上
- Python 3.13
- uv (Python パッケージマネージャー)
- AWS CLI (デプロイ時)
- Task (タスクランナー)

### ローカル開発環境のセットアップ

1. **リポジトリのクローン**
```bash
git clone https://github.com/tsuji-tomonori/diopside.git
cd diopside
```

2. **Task のインストール**
```bash
./install-task.sh
```

3. **依存関係のインストール**
```bash
# バックエンド
cd backend && uv sync && cd ..

# フロントエンド  
cd frontend && npm install && cd ..

# インフラストラクチャ
cd infrastructure && uv sync && cd ..
```

4. **フロントエンドの起動**
```bash
cd frontend
npm run dev
```
→ http://localhost:3000 でアクセス可能

5. **バックエンドの起動**
```bash
task backend:dev
```
→ http://localhost:8000 でAPI利用可能

## 📋 利用可能なタスク

### インフラストラクチャ
```bash
task bootstrap       # AWS環境初期化
task deploy          # 全スタックデプロイ
task deploy-waf      # WAFスタックのみ
task deploy-main     # メインスタックのみ
task diff            # 変更差分確認
task synth           # CloudFormationテンプレート生成
task clean           # ビルド成果物削除
task destroy         # 全リソース削除
```

### バックエンド開発
```bash
task backend:dev     # 開発サーバー起動
task backend:test    # テスト実行
task backend:lint    # リンター実行
```

### インフラのテスト
```bash
task test            # インフラテスト実行
task lint            # インフラリンター実行
```

## 📁 プロジェクト構成

```
diopside/
├── Taskfile.yaml          # タスク定義（デプロイ・開発）
├── install-task.sh        # Task インストールスクリプト
├── frontend/              # Next.js フロントエンド
│   ├── src/
│   │   ├── app/          # App Router
│   │   ├── components/   # React コンポーネント
│   │   └── lib/          # ユーティリティ
│   └── public/           # 静的ファイル
├── backend/              # FastAPI バックエンド
│   ├── app/
│   │   ├── api/          # API エンドポイント
│   │   ├── models/       # データモデル
│   │   └── services/     # ビジネスロジック
│   ├── tests/            # テストコード
│   └── pyproject.toml    # 依存関係管理（Lambda Layer用）
├── infrastructure/       # AWS CDK インフラ
│   ├── stacks/           # CDK スタック定義
│   ├── .layers/          # Lambda Layer（自動生成）
│   └── tests/            # インフラテスト
└── docs/                 # プロジェクトドキュメント
```

## 🔧 開発ガイド

### コーディング規約
- **Python**: PEP 8準拠、Ruffによる自動フォーマット
- **TypeScript**: ESLint + Prettierによる統一
- **コミット**: Conventional Commits形式

### テスト戦略
- **フロントエンド**: Jest + React Testing Library
- **バックエンド**: pytest + FastAPI TestClient
- **インフラ**: CDK Assertions + スナップショットテスト

### CI/CDパイプライン
- **GitHub Actions**による自動化
- **プルリクエスト**時の自動テスト実行
- **環境別デプロイ**: develop → dev環境、main → prod環境

## 🌐 デプロイメント

### 環境構成
- **開発環境**: `develop`ブランチから自動デプロイ
- **本番環境**: `main`ブランチから自動デプロイ

### 手動デプロイ
```bash
# インフラのデプロイ
cd infrastructure
uv run cdk deploy ShirayukiTomoFansiteDevStack

# フロントエンドのビルド・デプロイ
cd frontend
npm run build
# S3へのアップロード（CI/CDで自動化）
```

## 📚 ドキュメント

- [フロントエンド開発ガイド](./frontend/README.md)
- [バックエンドAPI仕様](./backend/README.md)
- [インフラ構築ガイド](./infrastructure/README.md)
- [デプロイメントガイド](./docs/deployment.md)
- [コントリビューションガイド](./docs/contributing.md)

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

### 開発フロー
- **Issue**での課題管理
- **プルリクエスト**でのコードレビュー
- **自動テスト**の通過が必須

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 🙏 謝辞

- **白雪巴**さんの素晴らしい配信活動
- オープンソースコミュニティの皆様
- 技術スタックの開発者・メンテナーの皆様

---

## 📞 サポート・お問い合わせ

- **Issues**: [GitHub Issues](https://github.com/tsuji-tomonori/diopside/issues)
- **Discussions**: [GitHub Discussions](https://github.com/tsuji-tomonori/diopside/discussions)

---

**注意**: このプロジェクトは個人のファンプロジェクトであり、公式とは関係ありません。