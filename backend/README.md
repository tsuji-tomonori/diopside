# Diopside Backend API

白雪巴ファンサイトのバックエンドAPI - FastAPIベースのサーバーレスアプリケーション

## 🎯 概要

このバックエンドは、白雪巴VTuberの配信アーカイブ管理システムのAPIを提供します。FastAPIフレームワークを使用し、AWS Lambdaでのサーバーレス実行に対応しています。

## 🏗️ アーキテクチャ

### 技術スタック
- **フレームワーク**: FastAPI 0.115.x
- **言語**: Python 3.13
- **データベース**: AWS DynamoDB
- **ストレージ**: AWS S3
- **デプロイ**: AWS Lambda + Mangum
- **パッケージ管理**: uv

### API設計
- **RESTful API**: リソースベースのエンドポイント設計
- **OpenAPI**: 自動生成されるAPI仕様書
- **Pydantic**: 型安全なデータバリデーション
- **非同期処理**: async/awaitによる高パフォーマンス

## 📁 プロジェクト構成

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPIアプリケーション
│   ├── models/              # Pydanticデータモデル
│   ├── services/            # ビジネスロジック層
│   └── routers/             # APIルートハンドラー
├── tests/                   # テストスイート
├── main.py                  # アプリケーションエントリーポイント
└── pyproject.toml          # プロジェクト設定
```

## 🚀 セットアップ

### 前提条件
- Python 3.13以上
- uv (推奨パッケージマネージャー)
- AWS CLI (デプロイ時)

### ローカル開発環境

1. **依存関係のインストール**
```bash
cd backend

# uvがインストールされていない場合
curl -LsSf https://astral.sh/uv/install.sh | sh

# 依存関係のインストール
uv sync --dev
```

2. **環境変数の設定**
```bash
# 環境変数の設定（必要に応じて）
export DYNAMODB_TABLE_NAME=ArchiveMetadata-dev
export S3_BUCKET_NAME=shirayuki-tomo-fansite-dev
export ENVIRONMENT=dev
export AWS_REGION=ap-northeast-1
```

3. **開発サーバーの起動**
```bash
# 開発サーバー（ホットリロード付き）
uv run python main.py

# または直接uvicornを使用
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

4. **API仕様書の確認**
- **API**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📋 API エンドポイント

### コアエンドポイント

- `GET /` - ヘルスチェック
- `GET /health` - サービス健全性ステータス
- `GET /docs` - インタラクティブAPI仕様書
- `GET /redoc` - 代替API仕様書

### 動画エンドポイント

#### `GET /api/videos`
年別動画一覧の取得（ページネーション付き）

**パラメータ:**
- `year` (int): 取得する年
- `limit` (int, optional): 取得件数 (デフォルト: 20)
- `offset` (int, optional): オフセット (デフォルト: 0)

**レスポンス例:**
```json
{
  "items": [
    {
      "video_id": "dQw4w9WgXcQ",
      "title": "【ホラーゲーム】Cry of Fear",
      "tags": ["ゲーム実況", "ホラー"],
      "year": 2023,
      "thumbnail_url": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      "created_at": "2023-10-15T14:30:00Z"
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

#### `GET /api/videos/{video_id}`
特定の動画詳細取得

#### `GET /api/videos/by-tag`
階層タグパスによる動画取得

**パラメータ:**
- `path` (str): 階層タグパス（例: "ゲーム実況/ホラー"）

#### `GET /api/videos/random`
ランダム動画取得（発見機能用）

**パラメータ:**
- `count` (int): 取得件数 (デフォルト: 3)

#### `GET /api/videos/memory`
メモリーゲーム用サムネイルペア取得

**パラメータ:**
- `pairs` (int): ペア数 (デフォルト: 8)

### タグエンドポイント

#### `GET /api/tags`
階層タグツリー構造の取得

**レスポンス例:**
```json
{
  "name": "ゲーム実況",
  "children": [
    {
      "name": "ホラー",
      "children": [
        {"name": "Cry of Fear", "count": 5}
      ],
      "count": 1
    }
  ],
  "count": 1
}
```

## 🧪 テスト

### テスト実行
```bash
# 全テストの実行
uv run pytest

# カバレッジ付きテスト
uv run pytest --cov=app

# 特定のテストファイル
uv run pytest tests/test_models.py

# 詳細モードでのテスト実行
uv run pytest -v
```

### テスト構成
- **単体テスト**: 各モデル・サービスの個別テスト
- **統合テスト**: API エンドポイントのテスト
- **モックテスト**: AWS サービスのモック化

## 🔍 コード品質

### 品質チェック
```bash
# 型チェック（mypy）
uv run mypy app/

# リンティング・フォーマット（ruff）
uv run ruff check app/
uv run ruff format app/

# 全品質チェックの実行
uv run mypy app/ && uv run ruff check app/ && uv run ruff format app/
```

### コーディング規約
- **PEP 8**: Python標準のスタイルガイド
- **Type Hints**: 型注釈の必須使用
- **Docstrings**: Google形式のドキュメント文字列
- **Ruff**: 自動フォーマット・リンティング

## 📊 データモデル

### 動画モデル
```python
{
    "video_id": "dQw4w9WgXcQ",           # YouTube動画ID
    "title": "【ホラーゲーム】Cry of Fear", # 動画タイトル
    "tags": ["ゲーム実況", "ホラー"],      # 階層タグ
    "year": 2023,                        # 公開年
    "thumbnail_url": "https://...",      # サムネイルURL
    "created_at": "2023-10-15T14:30:00Z" # ISO8601タイムスタンプ
}
```

### タグツリー構造
```python
{
    "name": "ゲーム実況",
    "children": [
        {
            "name": "ホラー",
            "children": [
                {"name": "Cry of Fear", "count": 5}
            ],
            "count": 1
        }
    ],
    "count": 1
}
```

## 🗄️ データベーススキーマ

### DynamoDBテーブル: `videos`

**主キー構成:**
- **パーティションキー**: `video_id` (String)
- **GSI1**: `year` (Number) + `video_id` (String) - 年別クエリ用

**属性:**
- `video_id`: String - YouTube動画ID
- `title`: String - 動画タイトル
- `tags`: List<String> - 階層タグ
- `year`: Number - 公開年
- `thumbnail_url`: String - サムネイルURL
- `created_at`: String - ISO8601タイムスタンプ

## 🚀 デプロイメント

このアプリケーションは以下のAWSサービスで動作するよう設計されています：

- **AWS Lambda**: サーバーレスコンピュート
- **DynamoDB**: NoSQLデータベース
- **API Gateway**: HTTP APIルーティング
- **CloudFront**: CDNとキャッシング

デプロイ設定については `infrastructure/` ディレクトリのAWS CDK設定を参照してください。

## 🔧 設定

### 環境変数

| 変数名 | 説明 | デフォルト値 |
|--------|------|-------------|
| `AWS_REGION` | AWSリージョン | `ap-northeast-1` |
| `DYNAMODB_TABLE_NAME` | DynamoDBテーブル名 | `ArchiveMetadata-dev` |
| `S3_BUCKET_NAME` | S3バケット名 | `shirayuki-tomo-fansite-dev` |
| `ENVIRONMENT` | 実行環境 | `dev` |
| `LOG_LEVEL` | ログレベル | `INFO` |

## 📝 API使用例

### 2023年の動画取得
```bash
curl "http://localhost:8000/api/videos?year=2023&limit=10"
```

### タグ階層による動画取得
```bash
curl "http://localhost:8000/api/videos/by-tag?path=ゲーム実況/ホラー"
```

### ランダム動画取得
```bash
curl "http://localhost:8000/api/videos/random?count=3"
```

### メモリーゲーム用サムネイル取得
```bash
curl "http://localhost:8000/api/videos/memory?pairs=8"
```

### タグ階層取得
```bash
curl "http://localhost:8000/api/tags"
```

## 🛡️ セキュリティ

### 認証・認可
- **CORS**: フロントエンドからのアクセス制御
- **レート制限**: API呼び出し頻度の制限
- **入力検証**: Pydanticによる厳密な検証

### データ保護
- **暗号化**: DynamoDB・S3での保存時暗号化
- **アクセス制御**: IAMロールによる最小権限の原則
- **監査ログ**: API アクセスの記録

## 🔍 モニタリング・ログ

### ログ設定
- **CloudWatch**: Lambda実行ログ
- **X-Ray**: 分散トレーシング
- **カスタムメトリクス**: ビジネスメトリクスの収集

### パフォーマンス最適化
- **コールドスタート対策**: 依存関係の最小化
- **メモリ使用量**: 128MB設定での最適化
- **接続プール**: DynamoDB接続の再利用

## 🤝 コントリビューション

1. リポジトリをフォーク
2. フィーチャーブランチを作成
3. 変更を実装
4. テスト・品質チェックを実行
5. プルリクエストを提出

### 開発フロー
- **Issue**: バグ報告・機能要望
- **プルリクエスト**: コードレビュー
- **自動テスト**: CI/CDでの品質保証

## 📄 ライセンス

このプロジェクトはDiopside VTuberファンサイトシステムの一部です。

---

## 📞 サポート

- **Issues**: [GitHub Issues](https://github.com/tsuji-tomonori/diopside/issues)
- **API仕様**: http://localhost:8000/docs (開発時)
- **ログ**: CloudWatch Logs (本番環境)