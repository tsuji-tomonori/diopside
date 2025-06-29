# MADR-001: VTuber配信内容のあいまい検索機能実装 (低コスト版)

## ステータス

採用決定

## コンテキスト

Diopsideアーカイブサイトにおいて、動画タイトルだけでなく配信内容（文字起こし・チャット）を対象とした高度な検索機能を実装する。

### 要件
- **あいまい検索**: 「親知らず 抜歯」→ 配信内で話題になった医療関連動画を検索
- **表記ゆれ対応**: 「Blue Archive」→「ブルーアーカイブ」「ブルアカ」の動画を検索
- **内容検索**: タイトルだけでなく配信中の発言・チャットコメントから検索
- **レスポンス性能**: 検索結果を2秒以内で返却

### 制約
- **低ランニングコスト重視**: 月額$20以下を目標
- サーバレスアーキテクチャを維持
- 既存のアーキテクチャとの統合
- オープンソース・無料サービス活用を推奨

## 採用決定: SQLite + Lambda 低コスト検索

**アーキテクチャ:**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │ -> │  Search API      │ -> │  Search Lambda  │
│   (検索UI)      │    │  (FastAPI)       │    │  (SQLite FTS)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         v
                        ┌─────────────────────────────────────────┐
                        │           Storage Layer                 │
                        │  ┌─────────────┐  ┌─────────────────┐  │
                        │  │ DynamoDB    │  │ S3 Bucket       │  │
                        │  │ (Videos)    │  │ (SQLite Files)  │  │
                        │  └─────────────┘  └─────────────────┘  │
                        └─────────────────────────────────────────┘
```

**データ構造 (SQLite FTS):**
```sql
-- 検索用SQLiteデータベース (S3保存)
CREATE VIRTUAL TABLE search_index USING fts5(
  video_id,
  title,
  transcript_text,
  chat_text,
  keywords,
  content='search_documents',
  tokenize='porter unicode61'
);

-- 同義語テーブル
CREATE TABLE synonyms (
  term TEXT PRIMARY KEY,
  synonyms TEXT -- JSON配列: ["Blue Archive", "ブルーアーカイブ", "ブルアカ"]
);

-- 検索文書テーブル
CREATE TABLE search_documents (
  video_id TEXT PRIMARY KEY,
  title TEXT,
  transcript_text TEXT,
  chat_text TEXT,
  keywords TEXT
);
```

**検索処理:**
1. Lambda起動時にS3からSQLiteファイルをダウンロード
2. 同義語テーブルでクエリ拡張（「ブルアカ」→「Blue Archive OR ブルーアーカイブ OR ブルアカ」）
3. FTS5のMATCH演算子で高速全文検索
4. BM25ランキングで結果を返却

**検索例の実装:**

1. **「親知らず 抜歯」検索:**
```sql
SELECT video_id, bm25(search_index) as score
FROM search_index
WHERE search_index MATCH '親知らず OR 抜歯 OR 手術 OR 歯科'
ORDER BY score;
```

2. **「Blue Archive」検索:**
```sql
-- 同義語拡張後
SELECT video_id, bm25(search_index) as score
FROM search_index
WHERE search_index MATCH '"Blue Archive" OR ブルーアーカイブ OR ブルアカ'
ORDER BY score;
```

**利点:**
- **超低コスト**: S3ストレージ + Lambda実行のみ
- **高速検索**: SQLite FTS5の最適化された検索
- **表記ゆれ対応**: 同義語テーブル + porter tokenizer
- **実装シンプル**: 標準SQLiteライブラリのみ

**欠点:**
- SQLiteファイルのダウンロード時間（初回のみ）
- 同時アクセス時のファイル競合（Lambda同時実行数制限で解決）

## 詳細実装計画 (総期間: 3.5週間)

### Phase 1: データ収集・前処理基盤構築 (1.5週間)

#### 1.1 データソース調査・設計 (2日)
- [ ] **既存データ形式の調査**
  - DynamoDB Videosテーブルの構造確認
  - 文字起こしデータの保存場所・形式特定
  - チャットデータの保存場所・形式特定
  - メタデータ（タイトル、投稿日、タグ）の構造確認
- [ ] **データ品質監査**
  - 文字起こしの精度・完全性チェック
  - チャットデータの欠損・重複チェック
  - エンコーディング問題の特定
  - タイムスタンプの一貫性確認
- [ ] **データ取得戦略設計**
  - 新規動画の自動処理フロー設計
  - 既存データの移行計画策定
  - データ更新頻度・タイミング決定

#### 1.2 データ前処理パイプライン実装 (3日)
- [ ] **前処理スクリプト基盤作成**
  ```python
  # package/scripts/src/search_index_builder.py
  ```
  - DynamoDBからの動画データ取得
  - S3からの文字起こしファイル取得
  - チャットデータ収集処理
- [ ] **テキスト正規化処理**
  - 全角半角統一（英数字、記号）
  - 絵文字・特殊文字の処理方針決定
  - URLリンクの除去・置換
  - 繰り返し文字の正規化（「wwww」→「w」）
- [ ] **ノイズフィルタリング**
  - チャットスパムの検出・除去
  - ボット投稿の識別・除去
  - 意味のない短文の除外（「888」「うぽつ」等）
  - NGワード・不適切コンテンツのフィルタリング
- [ ] **話者・コンテキスト分離**
  - 配信者発言とチャット発言の分離
  - スーパーチャット・メンバーシップの識別
  - モデレーター・認証済みユーザーの識別

#### 1.3 形態素解析・分かち書き実装 (2日)
- [ ] **日本語処理ライブラリ選定**
  - SudachiPy vs Janome vs MeCab性能比較
  - 辞書サイズ・精度・速度のトレードオフ評価
  - Lambda実行環境での動作検証
- [ ] **分かち書き処理実装**
  ```python
  def tokenize_japanese_text(text: str) -> List[str]:
      """日本語テキストの分かち書き処理"""
  ```
  - 基本形正規化（「走った」→「走る」）
  - 品詞フィルタリング（名詞、動詞、形容詞のみ）
  - ストップワード除去（「です」「ます」「という」）
  - 固有名詞の保護（ゲーム名、キャラクター名）
- [ ] **多言語対応設計**
  - 英語単語の処理（ステミング・レンマ化）
  - 数字・記号の扱い方針
  - 混在テキスト（日英混在）の処理

#### 1.4 同義語辞書構築 (3日)
- [ ] **ゲーム関連同義語収集**
  - 主要ゲームタイトルの表記ゆれ調査
    - 例：「Blue Archive」「ブルーアーカイブ」「ブルアカ」「BA」
  - ゲームキャラクター名の略称・愛称
  - ゲーム内用語・スラングの対応
- [ ] **VTuber業界用語辞書**
  - 配信用語（「配信」「枠」「生放送」）
  - ファン用語（「推し」「箱推し」「同接」）
  - プラットフォーム固有用語（「スパチャ」「メンシ」）
- [ ] **一般用語・専門用語辞書**
  - 医療用語（「親知らず」「抜歯」「手術」）
  - 技術用語（「プログラミング」「コーディング」）
  - 日常用語の口語・書面語対応
- [ ] **同義語辞書データ構造設計**
  ```json
  {
    "Blue Archive": {
      "synonyms": ["ブルーアーカイブ", "ブルアカ", "BA"],
      "weight": 1.0,
      "category": "game_title"
    }
  }
  ```

### Phase 2: SQLite FTS5データベース構築 (1週間)

#### 2.1 データベーススキーマ設計 (1日)
- [ ] **検索文書テーブル設計**
  ```sql
  CREATE TABLE search_documents (
    video_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    transcript_text TEXT,
    chat_text TEXT,
    speaker_text TEXT,    -- 配信者発言のみ
    keywords TEXT,        -- 抽出キーワード
    tags TEXT,           -- 動画タグ
    upload_date TEXT,
    duration_seconds INTEGER,
    view_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
- [ ] **FTS5仮想テーブル設計**
  ```sql
  CREATE VIRTUAL TABLE search_index USING fts5(
    video_id UNINDEXED,
    title,
    transcript_text,
    chat_text,
    keywords,
    tags,
    content='search_documents',
    content_rowid='rowid',
    tokenize='porter unicode61 remove_diacritics 1'
  );
  ```
- [ ] **同義語・設定テーブル設計**
  ```sql
  CREATE TABLE synonyms (
    id INTEGER PRIMARY KEY,
    term TEXT NOT NULL,
    synonyms TEXT NOT NULL,  -- JSON array
    category TEXT,
    weight REAL DEFAULT 1.0,
    is_active BOOLEAN DEFAULT TRUE
  );

  CREATE TABLE search_config (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```

#### 2.2 データ投入・インデックス構築 (2日)
- [ ] **バッチ処理スクリプト実装**
  ```python
  async def build_search_index():
      """検索インデックス構築メイン処理"""
  ```
  - DynamoDBからの全動画データ取得
  - 並列処理での効率的なデータ処理
  - プログレス表示・エラーログ出力
  - 中断・再開機能の実装
- [ ] **データ変換・クリーニング処理**
  - テキストの重複除去
  - 長すぎるテキストの分割・要約
  - 検索性能に影響するノイズの除去
  - メタデータの正規化
- [ ] **インデックス最適化**
  - VACUUM処理による最適化
  - ANALYZE統計情報更新
  - ファイルサイズ最小化
  - 圧縮アルゴリズムの適用検討

#### 2.3 検索性能テスト・調整 (2日)
- [ ] **基本検索性能テスト**
  ```python
  def test_search_performance():
      """検索クエリの性能測定"""
  ```
  - 単語検索レスポンス時間測定
  - 複合検索クエリの性能評価
  - 大量結果の取得性能テスト
  - メモリ使用量監視
- [ ] **検索結果品質評価**
  - 関連度の高い結果の上位表示確認
  - 表記ゆれ検索の精度評価
  - 偽陽性・偽陰性の特定と改善
  - ユーザー期待値との照合
- [ ] **SQLite設定最適化**
  - page_size最適化
  - cache_size調整
  - journal_mode設定
  - synchronous設定調整

### Phase 3: Lambda検索エンジン実装 (1週間)

#### 3.1 Lambda基盤・環境構築 (1日)
- [ ] **Lambda関数作成**
  ```
  package/api/lambdas/search_function/
  ├── main.py              # Lambda エントリーポイント
  ├── search_engine.py     # 検索ロジック
  ├── synonym_expander.py  # 同義語展開
  ├── query_parser.py      # クエリ解析
  └── requirements.txt
  ```
- [ ] **IAM Role・Policy設定**
  - S3バケットアクセス権限
  - CloudWatch Logs書き込み権限
  - DynamoDB読み取り権限（必要に応じて）
  - 最小権限の原則適用
- [ ] **Lambda Layer作成**
  - SQLite3ライブラリ
  - 日本語形態素解析ライブラリ
  - 共通ユーティリティ関数
- [ ] **環境変数・設定**
  ```python
  SEARCH_DB_BUCKET = os.environ['SEARCH_DB_BUCKET']
  SEARCH_DB_KEY = os.environ['SEARCH_DB_KEY']
  MAX_RESULTS = int(os.environ.get('MAX_RESULTS', '50'))
  ```

#### 3.2 検索エンジンコア実装 (3日)
- [ ] **S3からのデータベース取得処理**
  ```python
  async def download_search_db() -> str:
      """S3からSQLiteファイルをダウンロード"""
  ```
  - 効率的なダウンロード処理
  - Lambda /tmp領域の管理
  - ファイル整合性チェック
  - キャッシュ機能（Lambda warm start対応）
- [ ] **クエリパーサー実装**
  ```python
  class QueryParser:
      def parse(self, query: str) -> ParsedQuery:
          """検索クエリの解析・正規化"""
  ```
  - AND/OR/NOT演算子対応
  - フレーズ検索（"完全一致"）対応
  - ワイルドカード検索対応
  - 特殊文字エスケープ処理
- [ ] **同義語展開エンジン**
  ```python
  class SynonymExpander:
      def expand_query(self, terms: List[str]) -> str:
          """同義語を含むクエリ展開"""
  ```
  - 同義語辞書の効率的な検索
  - 重み付き同義語展開
  - 循環参照の回避
  - 展開クエリの最適化
- [ ] **FTS5検索実行エンジン**
  ```python
  class SearchEngine:
      def search(self, query: str, limit: int, offset: int) -> SearchResult:
          """メイン検索処理"""
  ```
  - FTS5 MATCH構文の動的生成
  - BM25スコアの活用
  - 結果の後処理・フィルタリング
  - ページネーション処理

#### 3.3 検索結果最適化・ランキング (2日)
- [ ] **スコアリングアルゴリズム実装**
  ```python
  def calculate_relevance_score(result: dict) -> float:
      """検索結果の関連度スコア計算"""
  ```
  - FTS5 BM25スコアをベースとした計算
  - タイトル・本文の重み付け
  - 動画の人気度（視聴回数）考慮
  - 投稿日の新しさ考慮
- [ ] **結果のグルーピング・重複排除**
  - 同一動画の重複結果統合
  - シリーズ動画のグルーピング
  - 類似度の高い結果の統合
- [ ] **検索結果ハイライト機能**
  ```python
  def generate_snippet(text: str, query_terms: List[str]) -> str:
      """検索語をハイライトしたスニペット生成"""
  ```
  - マッチした部分の前後コンテキスト抽出
  - HTML/マークダウンフォーマット対応
  - 複数マッチ箇所の統合表示

#### 3.4 エラーハンドリング・監視 (1日)
- [ ] **包括的エラーハンドリング**
  ```python
  try:
      result = search_engine.search(query)
  except SearchEngineError as e:
      logger.error(f"Search failed: {e}")
      return error_response(500, "検索処理でエラーが発生しました")
  ```
  - S3アクセスエラー対応
  - SQLiteファイル破損対応
  - メモリ不足エラー対応
  - タイムアウトエラー対応
- [ ] **ログ・メトリクス実装**
  - 構造化ログ出力
  - 検索クエリ・結果数のログ
  - 実行時間・メモリ使用量監視
  - エラー発生頻度の追跡
- [ ] **セキュリティ対策**
  - SQLインジェクション対策
  - クエリ長制限
  - レート制限の検討
  - 機密情報のマスキング

### Phase 4: API・フロントエンド統合 (0.5週間)

#### 4.1 FastAPI検索エンドポイント実装 (1日)
- [ ] **APIエンドポイント設計・実装**
  ```python
  @app.get("/api/search", response_model=SearchResponse)
  async def search_videos(
      q: str = Query(..., min_length=1, max_length=200),
      limit: int = Query(20, ge=1, le=100),
      offset: int = Query(0, ge=0),
      sort: SortOption = Query(SortOption.RELEVANCE)
  ):
  ```
- [ ] **リクエスト/レスポンスモデル**
  ```python
  class SearchRequest(BaseModel):
      query: str
      limit: int = 20
      offset: int = 0
      sort: SortOption = SortOption.RELEVANCE
      filters: Optional[SearchFilters] = None

  class SearchResponse(BaseModel):
      results: List[VideoSearchResult]
      total_count: int
      query: str
      execution_time_ms: int
  ```
- [ ] **バリデーション・エラーレスポンス**
  - クエリ文字列の検証
  - パラメータ範囲チェック
  - 適切なHTTPステータスコード返却
  - エラーメッセージの国際化対応

#### 4.2 フロントエンド検索UI実装 (1.5日)
- [ ] **検索UIコンポーネント作成**
  ```typescript
  // package/web/src/components/search/SearchInput.tsx
  // package/web/src/components/search/SearchResults.tsx
  // package/web/src/components/search/SearchFilters.tsx
  ```
- [ ] **検索結果表示コンポーネント**
  - 動画サムネイル・タイトル表示
  - 検索語ハイライト表示
  - ページネーション制御
  - ローディング・エラー状態管理
- [ ] **検索体験の最適化**
  - インクリメンタル検索（入力中の候補表示）
  - 検索履歴の保存・表示
  - 人気検索語の提案
  - 検索結果のソート・フィルター機能

#### 4.3 統合テスト・デバッグ (1日)
- [ ] **API統合テスト**
  - 正常系テストケース実行
  - 異常系テストケース実行
  - パフォーマンステスト実行
  - セキュリティテスト実行
- [ ] **フロントエンド統合テスト**
  - 検索フロー完全テスト
  - レスポンシブデザイン検証
  - 各ブラウザでの動作確認
  - アクセシビリティチェック

### Phase 5: 運用・最適化・監視 (0.5週間)

#### 5.1 パフォーマンス最適化 (1.5日)
- [ ] **Lambda設定最適化**
  - メモリサイズの調整（512MB→1GB→1.5GB）
  - タイムアウト値の最適化
  - 同時実行数制限の設定
  - プロビジョン済み同時実行の検討
- [ ] **SQLiteファイル最適化**
  - データベースサイズ削減手法適用
  - インデックス戦略の見直し
  - 分割戦略の実装（必要に応じて）
  - 圧縮アルゴリズムの検討
- [ ] **キャッシュ戦略実装**
  - Lambda内メモリキャッシュ
  - CloudFrontでのAPI結果キャッシュ
  - 検索結果の部分キャッシュ
  - キャッシュ無効化戦略

#### 5.2 監視・アラート設定 (1.5日)
- [ ] **CloudWatch監視設定**
  - Lambda実行時間・エラー率監視
  - メモリ使用量・スループット監視
  - S3アクセスパターン監視
  - API レスポンス時間監視
- [ ] **アラート設定**
  - エラー率閾値アラート
  - レスポンス時間アラート
  - コスト監視アラート
  - 異常アクセスパターン検知
- [ ] **ダッシュボード作成**
  - 検索利用状況ダッシュボード
  - 性能メトリクスダッシュボード
  - コスト分析ダッシュボード

#### 5.3 運用手順書・ドキュメント作成 (1日)
- [ ] **運用手順書作成**
  - 定期メンテナンス手順
  - データ更新手順
  - 障害対応手順
  - バックアップ・復旧手順
- [ ] **開発者向けドキュメント**
  - API詳細仕様書
  - 検索ロジック説明書
  - トラブルシューティングガイド
  - パフォーマンスチューニングガイド


## コスト見積り (月額)

- **S3 ストレージ**: $2-5 (SQLiteファイル 100MB-1GB)
- **Lambda 実行**: $3-10 (検索リクエスト 1000-5000回/月)
- **S3 データ転送**: $0.5-2 (ダウンロード量)
- **合計**: **$5.5-17/月** (目標$20以下を達成)

## 代替案

### 無料サービス活用
- **Supabase** (無料プラン): PostgreSQL FTS + 500MBストレージ → $0/月
- **Firebase** (無料プラン): Firestore + Cloud Functions (1GB/月) → $0/月
- **Vercel** (無料プラン): Edge Functions + KV Storage → $0/月

### 将来のスケールアップ
データ量が10GB以上になった場合:
- **Meilisearch** (オープンソース) on Fly.io → $30-50/月
- **Typesense Cloud** → $30-100/月
- **Amazon OpenSearch Service** → $100-300/月

詳細な無料オプションは `madr-001-fuzzy-search-alternative.md` を参照。

## 期待される結果

この実装により以下が実現される:

- **正確な検索**: 「親知らず 抜歯」で関連配信を発見
- **表記ゆれ対応**: 「Blue Archive」→「ブルアカ」のマッチング
- **高速レスポンス**: 1-2秒以内の検索結果返却
- **超低コスト**: 月額$5-17で運用可能
- **シンプル運用**: 外部API不要、標準AWSサービスのみ

この低コストアプローチにより、個人プロジェクトレベルでも持続可能な高度検索機能を実現できる。
