# タグ階層構造 設計書

## 1. 概要

既存のDiopsideシステムにおいて、フラットなタグ構造を階層的に整理し、自動化された階層構築機能を実装する。現在のシステムは基本的な階層表示機能を有しているが、タグの自動分類と効率的なクエリ機能を強化する。

## 2. システム構成

### 2.1 現在のアーキテクチャ

```
Frontend (Next.js)
├── TagTree Component - 階層表示UI
├── useTagTree Hook - タグツリー取得
└── useVideosByTag Hook - タグフィルタリング

Backend (FastAPI)
├── /api/tags - タグツリー構築API
├── /api/videos/by-tag - タグ別動画取得API
└── DynamoDBService - データアクセス層

Database (DynamoDB)
├── Main Table - 動画データ（PK, SK）
├── GSI1 - 年別クエリ（year, SK）
└── ByTag GSI - タグクエリ（Tag, SK）
```

### 2.2 強化ポイント

1. **タグ自動分類エンジン**: `docs/design/tag_rule.md`と`tag_analysis_table.csv`に基づく分類
2. **効率的なインデックス戦略**: 階層クエリの最適化
3. **キャッシュ機能**: タグツリー構築の高速化

## 3. データモデル設計

### 3.1 DynamoDBテーブル構造

#### 3.1.1 既存テーブル構造（変更なし）
```
PK: video_id (string)
SK: "VIDEO" (string)
attributes:
  - title: string
  - tags: list[string]  # フラットタグ配列
  - published_at: string
  - duration: string
  - year: number
  - Tag: string  # 第1タグ（ByTag GSI用）
```

#### 3.1.2 新規GSI: HierarchicalTag
```
PK: hierarchical_tag (string)  # 例: "ゲーム実況/ホラー"
SK: published_at (string)      # ソート用
attributes:
  - video_id: string
  - level: number              # 階層レベル（0=root, 1=child, etc.）
```

### 3.2 タグ階層データ構造

#### 3.2.1 階層化ルール
```python
class TagHierarchyRule:
    root_tags = [
        "ASMR", "お披露目", "イベント", "ゲーム実況",
        "企画", "朗読・声劇", "歌", "百合", "雑談", "shorts"
    ]

    subcategory_mapping = {
        "ゲーム実況": ["ホラー", "FPS/TPS", "RPG", "Minecraft", ...],
        "雑談": ["フリートーク", "マシュマロ", "お悩み相談", ...],
        "ASMR": ["耳かき", "耳責め", "添い寝", "ささやき", ...],
        # tag_rule.mdの中分類サブタグに基づく
    }

    game_tags = {
        # tag_analysis_table.csvの「ゲーム名」分類
        "Cry of Fear", "Minecraft", "Dead by Daylight", ...
    }

    person_tags = {
        # tag_analysis_table.csvの「人名」分類
        "健屋花那", "葛葉", "月ノ美兎", ...
    }
```

#### 3.2.2 階層構築アルゴリズム
```python
def build_hierarchy(flat_tags: list[str]) -> list[str]:
    """
    フラットタグ配列から階層構造を構築

    Input: ["ゲーム実況", "ホラー", "Cry of Fear"]
    Output: ["ゲーム実況/ホラー/Cry of Fear"]
    """

    # 1. 大分類タグを特定
    root_tag = find_root_tag(flat_tags)
    if not root_tag:
        return flat_tags  # 分類不能の場合はそのまま

    # 2. 中分類サブタグを配置
    subcategories = find_subcategories(flat_tags, root_tag)

    # 3. 具体的コンテンツタグを配置
    content_tags = find_content_tags(flat_tags, root_tag, subcategories)

    # 4. 階層パスを構築
    hierarchy_path = "/".join([root_tag] + subcategories + content_tags)

    return [hierarchy_path] + [tag for tag in flat_tags if tag not in used_tags]
```

## 4. API設計

### 4.1 既存API拡張

#### 4.1.1 GET /api/tags（拡張）
```typescript
interface TagNode {
  name: string;
  children: TagNode[];
  count: number;
  level: number;        // 新規追加
  hierarchy_path: string; // 新規追加：フルパス
}

interface TagTreeResponse {
  tag_tree: TagNode[];
  metadata: {
    total_videos: number;
    hierarchy_coverage: number; // 階層化率
    last_updated: string;
  };
}
```

#### 4.1.2 GET /api/videos/by-tag/{tag_path}（拡張）
```typescript
interface VideosByTagResponse {
  videos: Video[];
  pagination: PaginationInfo;
  tag_info: {
    hierarchy_path: string;
    level: number;
    parent_path?: string;
    children_paths: string[];
  };
}
```

### 4.2 新規API

#### 4.2.1 POST /api/tags/normalize
```typescript
interface TagNormalizeRequest {
  tags: string[];
}

interface TagNormalizeResponse {
  original_tags: string[];
  hierarchical_tags: string[];
  mapping_details: TagMapping[];
}

interface TagMapping {
  original: string;
  hierarchy_path: string;
  confidence: number;
  rule_applied: string;
}
```

## 5. 実装フロー

### 5.1 フェーズ1: タグ自動分類エンジン

#### 5.1.1 TagHierarchyService
```python
class TagHierarchyService:
    def __init__(self):
        self.rule_loader = TagRuleLoader()
        self.analyzer = TagAnalyzer()

    async def normalize_tags(self, flat_tags: list[str]) -> list[str]:
        """タグを階層構造に変換"""
        pass

    async def build_hierarchy_tree(self) -> TagNode:
        """全動画から階層ツリーを構築"""
        pass

    async def validate_hierarchy(self, hierarchy_path: str) -> bool:
        """階層パスの妥当性検証"""
        pass
```

#### 5.1.2 TagRuleLoader
```python
class TagRuleLoader:
    def load_major_categories(self) -> dict:
        """tag_rule.mdから大分類タグを読み込み"""
        pass

    def load_subcategories(self) -> dict:
        """tag_rule.mdから中分類サブタグを読み込み"""
        pass

    def load_tag_analysis_table(self) -> dict:
        """tag_analysis_table.csvから分類情報を読み込み"""
        pass
```

### 5.2 フェーズ2: データベース最適化

#### 5.2.1 インデックス追加
```python
# package/infra/src/stack/dynamodb_stack.py

class DynamoDBStack:
    def create_hierarchical_tag_gsi(self):
        """階層タグ用GSIを追加"""
        self.table.add_global_secondary_index(
            index_name="HierarchicalTag",
            partition_key=dynamodb.Attribute(
                name="hierarchical_tag",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="published_at",
                type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.INCLUDE,
            non_key_attributes=["video_id", "title", "level"]
        )
```

#### 5.2.2 データ移行スクリプト
```python
# package/scripts/src/migrate_tags_to_hierarchy.py

async def migrate_existing_tags():
    """既存のフラットタグを階層構造に移行"""

    hierarchy_service = TagHierarchyService()

    # 1. 全動画を取得
    videos = await db_service.scan_all_videos()

    # 2. タグを階層化
    for video in videos:
        hierarchical_tags = await hierarchy_service.normalize_tags(video.tags)

        # 3. 階層タグ用レコードを作成
        await db_service.create_hierarchy_records(video.video_id, hierarchical_tags)

    # 4. 階層ツリーを再構築
    await hierarchy_service.rebuild_tag_tree()
```

### 5.3 フェーズ3: キャッシュ実装

#### 5.3.1 Redis/ElastiCache統合
```python
class TagCacheService:
    def __init__(self):
        self.redis_client = redis.Redis(host=os.getenv("REDIS_ENDPOINT"))

    async def get_tag_tree(self) -> TagNode:
        """キャッシュからタグツリーを取得"""
        cached = await self.redis_client.get("tag_tree")
        if cached:
            return TagNode.parse_raw(cached)

        # キャッシュミスの場合はDynamoDBから構築
        tree = await self.hierarchy_service.build_hierarchy_tree()
        await self.redis_client.setex("tag_tree", 3600, tree.json())
        return tree

    async def invalidate_tag_cache(self):
        """タグキャッシュを無効化"""
        await self.redis_client.delete("tag_tree")
```

## 6. パフォーマンス最適化

### 6.1 クエリ最適化戦略

#### 6.1.1 階層レベル別インデックス
```python
# レベル0（ルートタグ）クエリ
query_params = {
    "IndexName": "HierarchicalTag",
    "KeyConditionExpression": "hierarchical_tag = :tag AND begins_with(SK, :prefix)",
    "ExpressionAttributeValues": {
        ":tag": "ゲーム実況",
        ":prefix": "VIDEO"
    }
}

# レベル1（サブカテゴリ）クエリ
query_params = {
    "IndexName": "HierarchicalTag",
    "KeyConditionExpression": "hierarchical_tag = :tag",
    "ExpressionAttributeValues": {
        ":tag": "ゲーム実況/ホラー"
    }
}
```

#### 6.1.2 バッチ処理によるツリー構築
```python
async def build_tag_tree_optimized(self) -> TagNode:
    """最適化されたタグツリー構築"""

    # 1. 階層レベル別に並列クエリ
    level_0_tags = await self.query_tags_by_level(0)
    level_1_tags = await self.query_tags_by_level(1)
    level_2_tags = await self.query_tags_by_level(2)

    # 2. メモリ上でツリー構築
    tree = self.assemble_tree(level_0_tags, level_1_tags, level_2_tags)

    return tree
```

### 6.2 メモリ使用量最適化
```python
class LazyTagNode:
    """遅延読み込み対応TagNode"""

    def __init__(self, name: str, hierarchy_path: str):
        self.name = name
        self.hierarchy_path = hierarchy_path
        self._children = None
        self._count = None

    @property
    def children(self) -> list['LazyTagNode']:
        if self._children is None:
            self._children = self.load_children()
        return self._children

    @property
    def count(self) -> int:
        if self._count is None:
            self._count = self.load_count()
        return self._count
```

## 7. テスト戦略

### 7.1 単体テスト
```python
# tests/unit/test_tag_hierarchy_service.py

class TestTagHierarchyService:
    def test_normalize_flat_tags(self):
        """フラットタグの階層化テスト"""
        service = TagHierarchyService()

        input_tags = ["ゲーム実況", "ホラー", "Cry of Fear"]
        expected = ["ゲーム実況/ホラー/Cry of Fear"]

        result = service.normalize_tags(input_tags)
        assert result == expected

    def test_handle_unknown_tags(self):
        """未知タグの処理テスト"""
        service = TagHierarchyService()

        input_tags = ["Unknown Game", "ゲーム実況"]
        result = service.normalize_tags(input_tags)

        # 分類可能なものは階層化、不明なものはそのまま
        assert "ゲーム実況" in result
        assert "Unknown Game" in result
```

### 7.2 統合テスト
```python
# tests/integration/test_tag_api.py

class TestTagAPI:
    async def test_tag_tree_endpoint(self):
        """タグツリーAPI統合テスト"""
        response = await client.get("/api/tags")

        assert response.status_code == 200
        data = response.json()

        assert "tag_tree" in data
        assert "metadata" in data
        assert data["metadata"]["hierarchy_coverage"] > 0.8

    async def test_videos_by_hierarchical_tag(self):
        """階層タグフィルタリング統合テスト"""
        response = await client.get("/api/videos/by-tag/ゲーム実況/ホラー")

        assert response.status_code == 200
        videos = response.json()["videos"]

        # 返された動画が条件に合致することを確認
        for video in videos:
            tags_contain_hierarchy = any(
                "ゲーム実況" in tag and "ホラー" in tag
                for tag in video["tags"]
            )
            assert tags_contain_hierarchy
```

## 8. デプロイメント

### 8.1 段階的ロールアウト
1. **フェーズ1**: バックエンドAPI拡張（既存機能への影響なし）
2. **フェーズ2**: データ移行（バックグラウンド処理）
3. **フェーズ3**: フロントエンド更新（階層表示強化）
4. **フェーズ4**: パフォーマンス最適化（キャッシュ等）

### 8.2 モニタリング
```python
# CloudWatch メトリクス
- TagTreeBuildTime: ツリー構築時間
- TagNormalizationSuccess: 正規化成功率
- HierarchyQueryLatency: 階層クエリレイテンシー
- CacheHitRatio: キャッシュヒット率
```

## 9. 今後の拡張

### 9.1 機械学習による自動分類
- 動画タイトル・説明文からのタグ推論
- ユーザー行動データに基づく階層最適化

### 9.2 ユーザー定義階層
- カスタムタグ階層の作成機能
- パーソナライズされたナビゲーション

### 9.3 階層統計・分析
- タグ使用頻度の可視化
- 階層パスの人気度ランキング
