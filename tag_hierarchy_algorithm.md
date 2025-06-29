# タグ検索機能の階層構造アルゴリズム

## 概要
Diopsideプロジェクトのタグ検索機能は、動画のタグを階層構造として扱い、柔軟な検索を可能にしています。

## データ構造

### タグの保存形式
- **保存場所**: DynamoDBのVideoテーブル
- **形式**: 文字列の配列 (`tags: string[]`)
- **例**: `["ゲーム実況", "ホラー", "Cry of Fear"]`
- **特徴**: スラッシュ区切りではなく、配列の順序で階層を表現

### TagNodeモデル
```python
class TagNode:
    tag: str          # タグ名
    count: int        # このタグを持つ動画数
    children: List[TagNode]  # 子タグのリスト
```

## アルゴリズム詳細

### 1. タグツリー構築アルゴリズム (`build_tag_tree`)

```python
def build_tag_tree():
    tag_tree = {}

    # 全動画をスキャン
    for video in all_videos:
        _add_tags_to_tree(video.tags, tag_tree)

    # 辞書をTagNodeオブジェクトに変換
    return _dict_to_tag_nodes(tag_tree)
```

### 2. タグの階層追加アルゴリズム (`_add_tags_to_tree`)

```python
def _add_tags_to_tree(tags: List[str], tree: dict):
    current_level = tree

    # タグ配列を階層パスとして処理
    for tag in tags:
        if tag not in current_level:
            current_level[tag] = {"count": 0, "children": {}}

        current_level[tag]["count"] += 1
        current_level = current_level[tag]["children"]
```

**処理例**:
- 入力: `["ゲーム実況", "ホラー", "Cry of Fear"]`
- 結果:
  ```
  ゲーム実況 (count: 1)
  └── ホラー (count: 1)
      └── Cry of Fear (count: 1)
  ```

### 3. タグパスマッチングアルゴリズム (`_tags_match_path`)

```python
def _tags_match_path(video_tags: List[str], path_tags: List[str]) -> bool:
    """
    パスタグが動画タグの連続した部分列として存在するかチェック
    """
    for i in range(len(video_tags) - len(path_tags) + 1):
        if video_tags[i:i + len(path_tags)] == path_tags:
            return True
    return False
```

**マッチング例**:
- 動画タグ: `["ゲーム実況", "ホラー", "Cry of Fear", "Part 1"]`
- 検索パス: `"ホラー/Cry of Fear"`
- 結果: マッチ（位置1-2に連続して存在）

### 4. タグ検索フロー

1. **フロントエンド**:
   - ユーザーがタグツリーから選択
   - 選択したタグをスラッシュで結合してパスを作成
   - 例: `["ゲーム実況", "ホラー"]` → `"ゲーム実況/ホラー"`

2. **API呼び出し**:
   ```
   GET /api/videos/by-tag?tag_path=ゲーム実況/ホラー
   ```

3. **バックエンド処理**:
   - パスをスラッシュで分割: `["ゲーム実況", "ホラー"]`
   - 全動画をスキャンし、`_tags_match_path`でフィルタリング
   - マッチした動画を返却

## 実装上の特徴

### 利点
1. **柔軟な階層表現**: 配列の順序で自然に階層を表現
2. **部分マッチング**: 階層の途中からの検索も可能
3. **動的な階層構築**: 事前定義不要で、データから自動構築

### パフォーマンス考慮
1. **タグツリー構築**: O(n×m) - n:動画数、m:平均タグ数
2. **タグ検索**: O(n×m) - 全動画スキャンが必要
3. **キャッシュ**: フロントエンドでSWRによるキャッシュを活用

### 設計上の決定事項
1. タグは配列として保存（スラッシュ区切り文字列ではない）
2. 階層は配列の順序で暗黙的に定義
3. スラッシュ区切りはAPI通信時のみ使用
4. タグツリーは動的生成（事前計算なし）

## コード参照

- **バックエンド実装**:
  - `package/api/app/services/dynamodb_service.py:253-317`
  - `package/api/app/routers/videos.py:108-129`

- **フロントエンド実装**:
  - `package/web/src/components/tag/TagTree.tsx`
  - `package/web/src/app/tags/page.tsx`

- **モデル定義**:
  - `package/api/app/models/video.py:9,19`
  - `package/api/app/models/tag.py:5-9`
