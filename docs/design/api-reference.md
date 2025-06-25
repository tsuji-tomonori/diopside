# API Reference

## Diopside API 仕様書

Diopside バックエンド API の詳細な仕様書です。

## ベース情報

### ベースURL
- **開発環境**: `http://localhost:8000`
- **本番環境**: `https://api.diopside.example.com`

### API バージョン
- **現在のバージョン**: v1
- **APIパス**: `/api/`

### 認証
現在のバージョンでは認証は不要です（読み取り専用API）。

### Content-Type
- **リクエスト**: `application/json`
- **レスポンス**: `application/json`

## エンドポイント一覧

### ヘルスチェック

#### `GET /`
システムの基本的なヘルスチェックエンドポイント。

**リクエスト例:**
```bash
curl -X GET http://localhost:8000/
```

**レスポンス:**
```json
{
  "message": "Diopside API is running",
  "status": "healthy"
}
```

#### `GET /health`
詳細なサービス状態確認エンドポイント。

**リクエスト例:**
```bash
curl -X GET http://localhost:8000/health
```

**レスポンス:**
```json
{
  "status": "healthy",
  "service": "diopside-backend"
}
```

### 動画関連エンドポイント

#### `GET /api/videos`
年別の動画一覧を取得します。ページネーション対応。

**パラメータ:**
| 名前 | 型 | 必須 | 説明 | デフォルト値 |
|------|-----|------|------|-------------|
| `year` | integer | Yes | 取得する年（YYYY形式） | - |
| `limit` | integer | No | 最大取得件数（1-100） | 50 |
| `last_key` | string | No | ページネーション用キー | null |

**リクエスト例:**
```bash
curl -X GET "http://localhost:8000/api/videos?year=2024&limit=20"
```

**レスポンス:**
```json
{
  "items": [
    {
      "video_id": "dQw4w9WgXcQ",
      "title": "【ホラーゲーム】Cry of Fear #1",
      "tags": ["ゲーム実況", "ホラー", "Cry of Fear"],
      "year": 2024,
      "thumbnail_url": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      "created_at": "2024-01-15T14:30:00Z"
    }
  ],
  "last_key": "eyJ2aWRlb19pZCI6InRlc3QxMjMiLCJ5ZWFyIjoyMDI0fQ=="
}
```

**ステータスコード:**
- `200`: 成功
- `400`: 無効なパラメータ
- `500`: サーバーエラー

#### `GET /api/videos/{video_id}`
特定のビデオIDで動画詳細を取得します。

**パラメータ:**
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `video_id` | string | Yes | 動画ID |

**リクエスト例:**
```bash
curl -X GET http://localhost:8000/api/videos/dQw4w9WgXcQ
```

**レスポンス:**
```json
{
  "video_id": "dQw4w9WgXcQ",
  "title": "【ホラーゲーム】Cry of Fear #1",
  "tags": ["ゲーム実況", "ホラー", "Cry of Fear"],
  "year": 2024,
  "thumbnail_url": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
  "created_at": "2024-01-15T14:30:00Z"
}
```

**ステータスコード:**
- `200`: 成功
- `404`: 動画が見つからない
- `500`: サーバーエラー

#### `GET /api/videos/{video_id}/chat`
動画のチャット欄から生成した単語頻度ベクトルと類似動画IDを取得します。

**パラメータ:**
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `video_id` | string | Yes | 動画ID |

**レスポンス:**
```json
{
  "word_vector": {"こんにちは": 20, "草": 15},
  "related_videos": ["abc123", "def456", "ghi789"]
}
```

**ステータスコード:**
- `200`: 成功
- `404`: データが見つからない
- `500`: サーバーエラー

#### `GET /api/videos/by-tag`
階層タグパスで動画をフィルタリングします。

**パラメータ:**
| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `path` | string | Yes | タグパス（例: "ゲーム実況/ホラー/Cry of Fear"） |

**リクエスト例:**
```bash
curl -X GET "http://localhost:8000/api/videos/by-tag?path=ゲーム実況/ホラー"
```

**レスポンス:**
```json
{
  "items": [
    {
      "video_id": "dQw4w9WgXcQ",
      "title": "【ホラーゲーム】Cry of Fear #1",
      "tags": ["ゲーム実況", "ホラー", "Cry of Fear"],
      "year": 2024,
      "thumbnail_url": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      "created_at": "2024-01-15T14:30:00Z"
    }
  ]
}
```

**ステータスコード:**
- `200`: 成功
- `400`: 無効なタグパス
- `500`: サーバーエラー

#### `GET /api/videos/random`
ランダムな動画を取得します。

**パラメータ:**
| 名前 | 型 | 必須 | 説明 | デフォルト値 |
|------|-----|------|------|-------------|
| `count` | integer | No | 取得する動画数（1-20） | 1 |

**リクエスト例:**
```bash
curl -X GET "http://localhost:8000/api/videos/random?count=3"
```

**レスポンス:**
```json
{
  "items": [
    {
      "video_id": "dQw4w9WgXcQ",
      "title": "【ホラーゲーム】Cry of Fear #1",
      "tags": ["ゲーム実況", "ホラー", "Cry of Fear"],
      "year": 2024,
      "thumbnail_url": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      "created_at": "2024-01-15T14:30:00Z"
    }
  ]
}
```

**ステータスコード:**
- `200`: 成功
- `400`: 無効なcount値
- `500`: サーバーエラー

#### `GET /api/videos/memory`
メモリーゲーム用のサムネイル画像ペアを取得します。

**パラメータ:**
| 名前 | 型 | 必須 | 説明 | デフォルト値 |
|------|-----|------|------|-------------|
| `pairs` | integer | No | ペア数（2-20） | 8 |

**リクエスト例:**
```bash
curl -X GET "http://localhost:8000/api/videos/memory?pairs=6"
```

**レスポンス:**
```json
{
  "thumbnails": [
    "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    "https://img.youtube.com/vi/abc123def/maxresdefault.jpg",
    "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    "https://img.youtube.com/vi/abc123def/maxresdefault.jpg"
  ]
}
```

**注意**: 各サムネイルURLは正確に2回出現し、配列はシャッフルされています。

**ステータスコード:**
- `200`: 成功
- `400`: 無効なpairs値
- `500`: サーバーエラー

### タグ関連エンドポイント

#### `GET /api/tags`
階層タグツリー構造を取得します。

**リクエスト例:**
```bash
curl -X GET http://localhost:8000/api/tags
```

**レスポンス:**
```json
{
  "tree": [
    {
      "name": "ゲーム実況",
      "count": 150,
      "children": [
        {
          "name": "ホラー",
          "count": 45,
          "children": [
            {
              "name": "Cry of Fear",
              "count": 12,
              "children": null
            }
          ]
        },
        {
          "name": "アクション",
          "count": 30,
          "children": null
        }
      ]
    },
    {
      "name": "雑談",
      "count": 80,
      "children": null
    }
  ]
}
```

**ステータスコード:**
- `200`: 成功
- `500`: サーバーエラー

## データモデル

### Video
動画情報を表すメインのデータモデル。

```typescript
interface Video {
  video_id: string;        // 動画ID（YouTube動画IDなど）
  title: string;           // 動画タイトル
  tags: string[];          // 階層タグ配列
  year: number;            // 公開年
  thumbnail_url?: string;  // サムネイル画像URL（オプション）
  created_at?: string;     // 作成日時（ISO 8601形式、オプション）
}
```

### TagNode
タグツリー構造を表すデータモデル。

```typescript
interface TagNode {
  name: string;            // タグ名
  count: number;           // このタグを持つ動画数
  children?: TagNode[];    // 子タグ（オプション）
}
```

## ページネーション

### Last Key方式
大量のデータに対して効率的なページネーションを提供します。

**実装例:**
```typescript
// 最初のリクエスト
const response1 = await fetch('/api/videos?year=2024&limit=20');
const data1 = await response1.json();

// 次のページを取得
if (data1.last_key) {
  const response2 = await fetch(`/api/videos?year=2024&limit=20&last_key=${data1.last_key}`);
  const data2 = await response2.json();
}
```

## エラーハンドリング

### エラーレスポンス形式
```json
{
  "detail": "エラーメッセージ"
}
```

### 一般的なエラーコード
| コード | 説明 | 対処法 |
|--------|------|--------|
| 400 | Bad Request | リクエストパラメータを確認 |
| 404 | Not Found | リソースのIDを確認 |
| 422 | Validation Error | パラメータの型・範囲を確認 |
| 500 | Internal Server Error | サーバーログを確認 |

### バリデーションエラーの詳細
```json
{
  "detail": [
    {
      "loc": ["query", "year"],
      "msg": "ensure this value is greater than 1900",
      "type": "value_error.number.not_gt",
      "ctx": {"limit_value": 1900}
    }
  ]
}
```

## レート制限

### 現在の制限
- **Lambda同時実行数**: 1000（デフォルト）
- **API Gateway**: 10,000 requests/second
- **DynamoDB**: オンデマンド課金（自動スケーリング）

### 制限に達した場合
- HTTPステータス: `429 Too Many Requests`
- Retry-After ヘッダーで再試行時間を指定

## CORS設定

### 許可されるOrigin
- 開発環境: `http://localhost:*`
- 本番環境: `https://diopside.example.com`

### 許可されるメソッド
- `GET`
- `OPTIONS`

### 許可されるヘッダー
- `Content-Type`
- `Authorization`（将来の認証機能用）

## SDK・クライアントライブラリ

### TypeScript/JavaScript

```typescript
// api.ts
export class DiopsideAPI {
  constructor(private baseURL: string) {}

  async getVideosByYear(year: number, options?: {
    limit?: number;
    lastKey?: string;
  }) {
    const params = new URLSearchParams({
      year: year.toString(),
      ...(options?.limit && { limit: options.limit.toString() }),
      ...(options?.lastKey && { last_key: options.lastKey })
    });

    const response = await fetch(`${this.baseURL}/api/videos?${params}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return response.json();
  }

  async getRandomVideos(count: number = 1) {
    const response = await fetch(
      `${this.baseURL}/api/videos/random?count=${count}`
    );
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return response.json();
  }

  async getTags() {
    const response = await fetch(`${this.baseURL}/api/tags`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return response.json();
  }
}

// 使用例
const api = new DiopsideAPI('http://localhost:8000');
const videos = await api.getVideosByYear(2024, { limit: 10 });
```

## OpenAPI仕様

完全なOpenAPI 3.0仕様書は以下で確認できます：
- **開発環境**: http://localhost:8000/docs
- **本番環境**: https://api.diopside.example.com/docs

### OpenAPIファイルの取得
```bash
curl http://localhost:8000/openapi.json > diopside-api-spec.json
```

## 変更履歴

### v1.0.0 (2024-01-15)
- 初回リリース
- 基本的なCRUD操作
- タグ階層機能
- ページネーション対応

### 将来の予定

#### v1.1.0 (予定)
- 検索機能の追加
- フィルタリング機能の強化
- キャッシュ機能の追加

#### v2.0.0 (予定)
- 認証機能の追加
- ユーザー管理機能
- お気に入り機能

## パフォーマンス特性

### レスポンス時間目標
- **単一動画取得**: < 100ms
- **動画リスト取得**: < 300ms
- **タグツリー取得**: < 500ms

### スループット
- **同時リクエスト**: 1000 req/sec
- **データベース**: 読み取り 4000 RCU/sec

## セキュリティ

### 入力検証
- すべての入力パラメータはPydanticモデルで検証
- SQLインジェクション対策（NoSQLですが、同様の対策）
- XSS対策（適切なエスケープ処理）

### レート制限
- API Gateway レベルでの制限
- Lambda レベルでの制限

### ログ記録
- すべてのAPIリクエストをログ記録
- 個人情報はログに含めない
- CloudWatch Logsでの集約管理
