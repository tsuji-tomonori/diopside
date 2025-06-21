# Diopside - デザイン仕様書

## 1. プロジェクト概要

### 1.1 プロジェクト名
**Diopside** - 白雪巴VTuberファンサイト配信アーカイブシステム

### 1.2 目的・ビジョン
白雪巴VTuberの配信アーカイブを効率的に管理・検索・閲覧するためのWebアプリケーション。
ファンが過去の配信を簡単に見つけて楽しめるプラットフォームを提供する。

### 1.3 主要機能
- 配信アーカイブの一覧表示・検索
- タグベースでの分類・フィルタリング
- 年別・日付別での絞り込み
- メモリーゲーム（おまけ機能）
- レスポンシブ対応（PC・モバイル）

## 2. システムアーキテクチャ

### 2.1 全体アーキテクチャ
```
[ユーザー] → [CloudFront] → [S3 Static Website] → [API Gateway] → [Lambda] → [DynamoDB]
                    ↓
                [WAF v2]
```

### 2.2 技術スタック

#### フロントエンド
- **フレームワーク**: Next.js 15.3.3
- **言語**: TypeScript 5.x
- **UIライブラリ**: @heroui/react 2.7.9
- **スタイリング**: Tailwind CSS 4.x
- **アイコン**: @heroicons/react 2.2.0
- **状態管理**: SWR 2.3.3 (Server State)
- **HTTPクライアント**: Axios 1.9.0
- **アニメーション**: Framer Motion 12.16.0

#### バックエンド
- **フレームワーク**: FastAPI (Python 3.13)
- **ランタイム**: AWS Lambda
- **データベース**: Amazon DynamoDB
- **監視・ログ**: AWS PowerTools for Python
- **Lambda統合**: Mangum

#### インフラストラクチャ
- **IaC**: AWS CDK (TypeScript)
- **ホスティング**: Amazon S3 + CloudFront
- **API**: Amazon API Gateway
- **セキュリティ**: AWS WAF v2
- **ストレージ**: Amazon S3

#### 開発ツール
- **タスクランナー**: Task (Taskfile.yaml)
- **依存関係管理**: uv (Python), npm (Node.js)
- **テスト**: Jest (Unit), Playwright (E2E)
- **リンター**: ESLint, Ruff

## 3. データベース設計

### 3.1 DynamoDB テーブル構造

#### `archive_metadata` テーブル
```
Primary Key: video_id (String)
```

##### 主要属性
- `video_id`: 動画ID（主キー）
- `title`: 動画タイトル
- `url`: 動画URL
- `date`: 配信日時
- `tags`: タグ配列
- `thumbnail_url`: サムネイル画像URL
- `duration`: 動画時間
- `description`: 動画説明
- `view_count`: 視聴回数

### 3.2 データアクセスパターン
1. **全動画取得**: Scanオペレーション
2. **年別フィルタ**: Filterオペレーション（date属性）
3. **タグフィルタ**: Filterオペレーション（tags属性）
4. **ID指定取得**: GetItemオペレーション

## 4. API設計

### 4.1 エンドポイント一覧

#### ベースURL
- 開発環境: `https://api-dev.diopside.example.com/v1/`
- 本番環境: `https://api.diopside.example.com/v1/`

#### エンドポイント詳細

**GET /**
- 概要: ヘルスチェック
- レスポンス: `{"message": "Diopside API is running", "status": "healthy"}`

**GET /health**
- 概要: 詳細ヘルスチェック
- レスポンス: `{"status": "healthy", "service": "diopside-backend"}`

**GET /videos**
- 概要: 動画一覧取得
- クエリパラメータ:
  - `year`: 年フィルタ（オプション）
  - `tag`: タグフィルタ（オプション）
- レスポンス: Video配列

**GET /videos/{video_id}**
- 概要: 動画詳細取得
- レスポンス: Video詳細

**GET /videos/random**
- 概要: ランダム動画取得
- レスポンス: Video詳細

**GET /tags**
- 概要: 利用可能タグ一覧
- レスポンス: タグ配列

### 4.2 データモデル

#### Video
```typescript
interface Video {
  video_id: string;
  title: string;
  url: string;
  date: string; // ISO 8601
  tags: string[];
  thumbnail_url?: string;
  duration?: number;
  description?: string;
  view_count?: number;
}
```

## 5. UI/UX設計

### 5.1 デザインシステム

#### カラーパレット
- **プライマリ**: Hero UI デフォルトテーマ
- **セカンダリ**: カスタムブランドカラー
- **ダークモード**: 対応済み

#### タイポグラフィ
- **フォント**: システムフォント優先
- **フォントサイズ**: Tailwind CSS標準スケール

#### コンポーネント階層
```
MainLayout
├── Header
├── main content
│   ├── VideoGrid
│   │   └── VideoCard[]
│   ├── TagTree
│   ├── YearSelector
│   └── MemoryGame
└── Footer
```

### 5.2 ページ構成

#### トップページ (`/`)
- 動画一覧表示
- 年別フィルタ
- タグ絞り込み
- 検索機能

#### ランダムページ (`/random`)
- ランダム動画表示
- 再読み込み機能

#### タグページ (`/tags`)
- タグ階層表示
- タグ別動画一覧

#### メモリーゲーム (`/memory`)
- 配信サムネイルを使ったメモリーゲーム
- スコア機能

### 5.3 レスポンシブ対応
- **モバイル**: 375px以上
- **タブレット**: 768px以上
- **デスクトップ**: 1024px以上

## 6. セキュリティ設計

### 6.1 WAF設定
- SQLインジェクション対策
- XSS対策
- 不正アクセス対策
- レート制限

### 6.2 CORS設定
- 本番環境では特定オリジンのみ許可
- 開発環境では全オリジン許可

### 6.3 認証・認可
- 現在は認証なし（読み取り専用）
- 将来的に管理者認証を検討

## 7. パフォーマンス設計

### 7.1 フロントエンド最適化
- Next.js静的生成
- 画像最適化
- Code Splitting
- SWRによるキャッシュ

### 7.2 バックエンド最適化
- Lambda Cold Start対策
- DynamoDB適切なキャパシティ設定
- CloudFrontキャッシュ戦略

### 7.3 CDN設定
- 静的ファイルキャッシュ: 1年
- APIレスポンスキャッシュ: 5分
- エラーページキャッシュ: 1分

## 8. 監視・運用設計

### 8.1 ログ設計
- AWS PowerTools使用
- 構造化ログ出力
- CloudWatch Logs集約

### 8.2 メトリクス監視
- API レスポンス時間
- エラー率
- DynamoDB使用量
- CloudFront配信量

### 8.3 アラート設定
- API エラー率 > 5%
- レスポンス時間 > 3秒
- Lambda エラー発生

## 9. 開発・デプロイ設計

### 9.1 開発フロー
1. ローカル開発
2. 機能テスト（Jest + Playwright）
3. コード品質チェック（ESLint + Ruff）
4. ビルド・デプロイ

### 9.2 環境管理
- **開発環境**: `dev`
- **本番環境**: `prod`
- 環境別設定ファイル

### 9.3 CI/CD
- タスクランナー（Task）による自動化
- AWS CDKによるインフラ管理
- 統合デプロイコマンド

## 10. 将来的な拡張計画

### 10.1 機能拡張
- ユーザー認証・お気に入り機能
- コメント機能
- 配信スケジュール表示
- 通知機能

### 10.2 技術的改善
- GraphQL API移行検討
- マイクロサービス化
- リアルタイム機能（WebSocket）
- PWA対応

### 10.3 スケーラビリティ
- CDK Pipeline導入
- マルチリージョン対応
- Auto Scaling設定最適化

---

## 付録

### A. 開発環境セットアップ
詳細は `README.md` を参照

### B. APIドキュメント
開発環境: `http://localhost:8000/docs`

### C. テスト戦略
- **Unit Test**: Jest（コンポーネント・ユーティリティ）
- **Integration Test**: Playwright（API・UI）
- **E2E Test**: Playwright（ユーザーシナリオ）

### D. トラブルシューティング
- **Lambda Cold Start**: プロビジョニング済み同時実行数設定
- **DynamoDB Throttling**: On-Demand課金モード使用
- **CloudFront Cache**: 適切なCache-Controlヘッダー設定
