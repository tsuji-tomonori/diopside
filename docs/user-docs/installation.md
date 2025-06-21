# インストールガイド

## 前提条件

Diopsideをローカル環境で動作させるために必要な環境とツールです。

### システム要件

- **OS**: Windows 10/11, macOS 10.15+, Linux (Ubuntu 20.04+)
- **RAM**: 8GB以上推奨
- **ストレージ**: 5GB以上の空き容量

### 必要なソフトウェア

#### 1. Node.js
```bash
# Node.js 20.x 以上をインストール
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# バージョン確認
node --version  # v20.x.x以上
npm --version   # 10.x.x以上
```

#### 2. Python
```bash
# Python 3.13 をインストール
sudo apt update
sudo apt install python3.13 python3.13-dev python3.13-venv

# バージョン確認
python3.13 --version  # Python 3.13.x
```

#### 3. uv (Python パッケージマネージャー)
```bash
# uv のインストール
curl -LsSf https://astral.sh/uv/install.sh | sh

# パスを通す
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# バージョン確認
uv --version
```

#### 4. Git
```bash
# Git のインストール
sudo apt install git

# バージョン確認
git --version
```

#### 5. Moon (モノレポタスクランナー)
```bash
# Moon のインストール
curl -fsSL https://moonrepo.dev/install/moon.sh | bash

# パスを通す
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# バージョン確認
moon --version
```

## プロジェクトのセットアップ

### 1. リポジトリのクローン

```bash
# GitHubからクローン
git clone https://github.com/tsuji-tomonori/diopside.git
cd diopside
```

### 2. 依存関係のインストール

#### 全プロジェクト
```bash
# Moon を使用して全プロジェクトの依存関係をインストール
moon run web:install
moon run api:install
moon run infra:install
```

または個別に：

#### フロントエンド
```bash
# フロントエンドの依存関係をインストール
cd package/web
npm install
cd ../..
```

#### バックエンド
```bash
# バックエンドの依存関係をインストール
cd package/api
uv sync --dev
cd ../..
```

#### インフラストラクチャ（オプション）
```bash
# インフラ開発を行う場合
cd package/infra
uv sync --dev
cd ../..
```

### 3. 環境変数の設定

#### フロントエンド環境変数
```bash
# package/web/.env.local を作成
cd package/web
cat > .env.local << EOF
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SITE_NAME=白雪巴ファンサイト
NEXT_PUBLIC_SITE_DESCRIPTION=白雪巴VTuberの配信アーカイブサイト
EOF
cd ../..
```

#### バックエンド環境変数
```bash
# package/api/.env を作成
cd package/api
cat > .env << EOF
DYNAMODB_TABLE_NAME=local-archive-metadata
AWS_ACCESS_KEY_ID=dummy
AWS_SECRET_ACCESS_KEY=dummy
AWS_DEFAULT_REGION=ap-northeast-1
EOF
cd ../..
```

## ローカル開発環境の起動

### 1. バックエンドの起動

```bash
# FastAPI 開発サーバーを起動（Moon使用）
moon run :dev-api
```

または直接：
```bash
# FastAPI 開発サーバーを起動
cd package/api
uv run python main.py
```

APIサーバーは http://localhost:8000 で起動します。

#### API ドキュメント
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 2. フロントエンドの起動

```bash
# Next.js 開発サーバーを起動（Moon使用）
moon run :dev-web
```

または直接：
```bash
# Next.js 開発サーバーを起動（別ターミナル）
cd package/web
npm run dev
```

フロントエンドは http://localhost:50970 で起動します。

### 3. 動作確認

ブラウザで http://localhost:50970 にアクセスして、以下を確認してください：

- [ ] ページが正常に表示される
- [ ] 動画一覧が表示される（ダミーデータ）
- [ ] タグフィルターが動作する
- [ ] 年別フィルターが動作する

## データベースのセットアップ（オプション）

ローカル環境でDynamoDBを使用する場合は、DynamoDB Localを使用できます。

### DynamoDB Local のセットアップ

```bash
# Docker を使用してDynamoDB Local を起動
docker run -p 8000:8000 amazon/dynamodb-local

# テーブルの作成
aws dynamodb create-table \
  --table-name local-archive-metadata \
  --attribute-definitions \
    AttributeName=video_id,AttributeType=S \
    AttributeName=year,AttributeType=N \
  --key-schema \
    AttributeName=video_id,KeyType=HASH \
  --global-secondary-indexes \
    IndexName=GSI1,KeySchema='[{AttributeName=year,KeyType=HASH}]',Projection='{ProjectionType=ALL}',ProvisionedThroughput='{ReadCapacityUnits=5,WriteCapacityUnits=5}' \
  --provisioned-throughput \
    ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --endpoint-url http://localhost:8000
```

### サンプルデータの投入

```bash
# サンプルデータを投入
cd package/api
uv run python -c "
import boto3
import json
from datetime import datetime

dynamodb = boto3.resource('dynamodb', endpoint_url='http://localhost:8000')
table = dynamodb.Table('local-archive-metadata')

sample_data = [
    {
        'video_id': 'sample001',
        'title': 'サンプル動画1',
        'tags': ['ゲーム実況', 'ホラー'],
        'year': 2024,
        'thumbnail_url': 'https://via.placeholder.com/320x180?text=Sample1',
        'created_at': datetime.now().isoformat()
    },
    {
        'video_id': 'sample002',
        'title': 'サンプル動画2',
        'tags': ['雑談', '配信'],
        'year': 2024,
        'thumbnail_url': 'https://via.placeholder.com/320x180?text=Sample2',
        'created_at': datetime.now().isoformat()
    }
]

for item in sample_data:
    table.put_item(Item=item)

print('Sample data inserted successfully')
"
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. Node.js のバージョンエラー
```bash
# エラー: Node.js バージョンが古い
# 解決方法: Node Version Manager (nvm) を使用
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

#### 2. Python の依存関係エラー
```bash
# エラー: uv sync が失敗する
# 解決方法: Python の開発パッケージをインストール
sudo apt install python3-dev python3-pip

# uv を再インストール
curl -LsSf https://astral.sh/uv/install.sh | sh
```

#### 3. ポート番号の競合
```bash
# エラー: ポートが既に使用されている
# 解決方法: 別のポートを使用
cd package/web
npm run dev -- --port 3001

cd package/api
uv run uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

#### 4. CORS エラー
```bash
# エラー: Cross-Origin Request Blocked
# 解決方法: バックエンドのCORS設定確認
# package/api/app/main.py の CORS 設定を確認
```

#### 5. 環境変数が読み込まれない
```bash
# Next.js の環境変数は NEXT_PUBLIC_ プレフィックスが必要
# .env.local ファイルが正しい場所にあるか確認
ls package/web/.env.local

# バックエンドの環境変数確認
cd package/api
uv run python -c "import os; print(os.getenv('DYNAMODB_TABLE_NAME'))"
```

## 開発用ツールの設定

### VS Code 拡張機能（推奨）

```bash
# 推奨拡張機能一覧
code --install-extension ms-python.python
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension ms-python.black-formatter
code --install-extension charliermarsh.ruff
```

### エディタ設定

`.vscode/settings.json` ファイルを作成：

```json
{
  "python.defaultInterpreterPath": "./package/api/.venv/bin/python",
  "python.formatting.provider": "black",
  "python.linting.enabled": true,
  "python.linting.ruffEnabled": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  }
}
```

## 次のステップ

インストールが完了したら、以下のドキュメントを参照してください：

- [開発ガイド](../development/contributing.md) - 開発フローと規約
- [テストガイド](../development/testing-guide.md) - テストの実行方法
- [デプロイメントガイド](../operations/deployment.md) - 本番環境へのデプロイ

## サポート

インストールで問題が発生した場合：

1. [GitHub Issues](https://github.com/tsuji-tomonori/diopside/issues) で既存の問題を検索
2. 新しい問題を報告する際は、以下の情報を含めてください：
   - OS とバージョン
   - Node.js, Python, uv のバージョン
   - エラーメッセージの全文
   - 実行したコマンドの履歴
