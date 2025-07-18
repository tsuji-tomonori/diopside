# タグ検索画面仕様書

**URL**: `/tags`
**ファイル**: `package/web/src/app/tags/page.tsx`

## 1. 画面の役割（Why/What）

### 核心的役割
- **体系的探索**: 白雪巴さんの動画を構造化されたタグ階層で整理・探索
- **情報アーキテクチャ**: 膨大な動画コンテンツの論理的分類と発見支援
- **深掘り検索**: 特定テーマ・ジャンルでの詳細な動画探索

### 機能的役割
- **階層ナビゲーション**: ツリー構造での直感的な絞り込み検索
- **コンテンツ分類理解**: 動画の内容的分類とボリューム把握
- **関連性発見**: 同じタグを持つ動画群での関連コンテンツ発見

## 2. 機能詳細（How）

### 2.1 タグツリー表示機能
**コンポーネント**: `TagTree` + `TagNodeItem`

#### 階層構造仕様
- **データ形式**: `TagNode { name: string, count: number, children?: TagNode[] }`
- **パス表現**: スラッシュ区切り（例: "ゲーム実況/ホラー/Cry of Fear"）
- **深度制限**: 実装上の制限なし（データに依存）
- **カウント表示**: 各タグの対象動画数をChipで表示

#### UI動作詳細
- **展開/折りたたみ**:
  - 子要素あり: ChevronRight/Down アイコンでトグル
  - 子要素なし: Document アイコンで終端表示
- **インデント**: レベル×4の margin-left でツリー構造表現
- **初期状態**: ルートレベル（level 0）のみ展開済み
- **ホバー効果**: `hover:bg-gray-100 dark:hover:bg-gray-800`

#### アクセシビリティ
- **キーボード操作**: Hero UI Button による標準対応
- **スクリーンリーダー**: 適切な aria-label 設定
- **カラーコントラスト**: WCAG AA準拠

### 2.2 パンくずナビゲーション
**コンポーネント**: Hero UI `Breadcrumbs`

#### 機能仕様
- **表示内容**: 選択中タグパスをスラッシュ分割して階層表示
- **クリック動作**: 任意の親階層への遡行ナビゲーション
- **視覚的表現**: タグアイコン + "選択中のタグ:" ラベル

### 2.3 動画結果表示
**コンポーネント**: 共通 `VideoGrid`

#### 表示仕様
- **レイアウト**: メイン画面と同一の VideoCard グリッド
- **ローディング**: 統一された Loading コンポーネント
- **エラー処理**: 統一された ErrorMessage コンポーネント
- **空状態**:
  - 未選択時: "タグを選択してください"
  - 結果なし時: "動画が見つかりませんでした"

### 2.4 レスポンシブレイアウト
**2カラム構成**:
- **左カラム (lg:col-span-1)**: TagTree 表示
- **右カラム (lg:col-span-2)**: パンくず + VideoGrid

#### ブレークポイント対応
- **モバイル〜MD**: 1カラム、縦積み表示
- **LG以上**: 1:2比率の2カラムレイアウト

### 2.5 API連携
**2つのエンドポイント**:
1. **タグツリー取得**: `GET /api/tags` → `TagsResponse { tree: TagNode[] }`
2. **タグ別動画取得**: `GET /api/videos/by-tag?path={tagPath}` → `VideosByTagResponse { items: Video[] }`

### 2.6 状態管理
**主要状態**:
- `selectedTagPath`: 選択中のタグパス文字列
- タグツリーデータ: SWR管理（`useTagTree`）
- タグ別動画データ: SWR管理（`useVideosByTag`）

## 3. デザイン・UI構成（Look & Feel）

### 3.1 全体的なデザイン言語
- **情報整理**: 構造化された情報の直感的理解
- **探索支援**: 段階的絞り込みによる効率的な発見体験
- **階層表現**: ツリー構造の視覚的分かりやすさ

### 3.2 レイアウト構造
```
MainLayout
├── Header Section
│   ├── Title: "タグ検索" (text-4xl, purple-800)
│   └── Subtitle: "階層構造のタグで動画を探索"
└── 2-Column Grid (lg:grid-cols-3)
    ├── Left Column (lg:col-span-1)
    │   ├── TagTree Card
    │   │   ├── Header (Folder Icon + "タグ一覧")
    │   │   └── Scrollable Tree (max-h-96)
    │   └── Error State (conditional)
    └── Right Column (lg:col-span-2)
        ├── Selected Tag Card (conditional)
        │   ├── Tag Icon + "選択中のタグ:"
        │   └── Breadcrumbs Navigation
        ├── Error State (conditional)
        ├── Loading State (conditional)
        ├── VideoGrid (conditional)
        └── Empty States (conditional)
            ├── No Tag Selected
            └── No Videos Found
```

### 3.3 TagTree詳細デザイン
#### アイコン使用戦略
- **Folder Icon**: 子要素ありノード（紫色）
- **Document Icon**: 終端ノード（グレー）
- **Chevron Right/Down**: 展開状態表示
- **Tag Icon**: ページ全体のアクセント

#### インデント・階層表現
- **インデント量**: `ml-${level * 4}` で視覚的階層表現
- **ホバー効果**: 行全体への背景色変化
- **選択状態**: 現在未実装（改善要件）

#### スクロール対応
- **最大高**: `max-h-96` で縦スクロール制御
- **オーバーフロー**: `overflow-y-auto` で必要時のみスクロール表示

### 3.4 カラーパレット
- **アクセント**: 紫系統（purple-500, purple-800）
- **構造**: グレー系統（gray-100〜gray-800）
- **インタラクション**: Hero UI 標準カラー
- **カウント表示**: secondary カラーChip

### 3.5 タイポグラフィ
- **タグ名**: 標準サイズ、truncate で長名省略
- **カウント**: 小サイズ（text-xs）Chip内表示
- **ヘッダー**: セミボールド（font-semibold）

## 4. 改善要件（Better UX）

### 4.1 タグツリーナビゲーション強化
**現在の課題**: ツリー操作の効率性とユーザビリティが限定的

#### 提案改善
- **検索機能**: タグ名での部分一致検索・フィルタリング
- **全展開/全折りたたみ**: ワンクリックでのツリー全体操作
- **選択状態表示**: 現在選択中タグのハイライト表示
- **キーボードナビ**: 矢印キーでのツリー移動・選択

### 4.2 タグ情報の充実
**現在の課題**: タグのメタ情報が動画数のみで理解支援が不足

#### 提案改善
- **タグ説明**: 各タグの意味・背景説明のツールチップ
- **関連タグ**: 同時によく使われるタグの提案
- **人気度指標**: アクセス頻度・お気に入り数による人気表示
- **時系列分析**: タグの投稿時期傾向・季節性の可視化

### 4.3 複合検索・フィルタリング
**現在の課題**: 単一タグのみで複合条件での検索ができない

#### 提案改善
- **複数タグ選択**: AND/OR条件での複合タグ検索
- **除外タグ**: 特定タグを含まない動画の検索
- **年度フィルタ**: タグ + 年度の組み合わせ検索
- **ソート機能**: 投稿日・人気度・タイトル順での並び替え

### 4.4 タグ階層の可視化強化
**現在の課題**: 階層関係の理解と全体像把握が困難

#### 提案改善
- **ツリーマップ**: タグボリュームの面積表示
- **サンキー図**: タグ間の関連性フロー表示
- **階層統計**: 各階層レベルでの動画分布統計
- **ズーム機能**: 特定階層への焦点絞り込み表示

### 4.5 パーソナライゼーション
**現在の課題**: 全ユーザー共通の体験で個人の嗜好に対応していない

#### 提案改善
- **よく使うタグ**: 個人の利用頻度によるタグ優先表示
- **カスタムタグ**: ユーザー独自のタグ分類作成
- **お気に入りタグ**: 頻繁に使うタグのブックマーク
- **履歴機能**: 過去に検索したタグパスの履歴表示

### 4.6 動画結果表示の改善
**現在の課題**: 単純な一覧表示でタグとの関連性が見えない

#### 提案改善
- **関連度表示**: 選択タグとの関連性の強度表示
- **タグハイライト**: 結果動画での選択タグのマーク表示
- **関連タグ表示**: 結果動画の他のタグ情報表示
- **プレビュー機能**: ホバー時の動画詳細情報表示

### 4.7 探索支援・発見機能
**現在の課題**: 目的意識のない探索での発見支援が不足

#### 提案改善
- **おすすめタグ**: アクセスパターンによるタグ推薦
- **未探索タグ**: まだ見ていないタグの提案
- **トレンドタグ**: 最近人気上昇中のタグ表示
- **ランダムタグ**: 偶然の発見を促すランダム選択

### 4.8 ソーシャル・共有機能
**現在の課題**: 個人的探索で共有・コミュニケーション要素がない

#### 提案改善
- **タグ共有**: 特定タグパスのURL共有機能
- **タグレビュー**: ユーザーによるタグ・分類の評価
- **コミュニティタグ**: ユーザー投稿による追加分類
- **タグディスカッション**: タグごとのコメント・議論機能

### 4.9 パフォーマンス・スケーラビリティ
**現在の課題**: 大量タグでの表示・操作パフォーマンス

#### 提案改善
- **仮想スクロール**: 大量タグでの効率的レンダリング
- **遅延読み込み**: 階層展開時の子要素遅延取得
- **キャッシュ最適化**: タグツリー・動画結果の効率的キャッシュ
- **プリフェッチ**: よく使われるタグの先行読み込み

### 4.10 アクセシビリティ・ユーザビリティ
**現在の課題**: 多様なユーザーニーズへの対応が不十分

#### 提案改善
- **キーボード完全対応**: マウス不要のフル操作対応
- **スクリーンリーダー対応**: ツリー構造の適切な読み上げ
- **高コントラストモード**: 視覚障害者向けテーマ
- **操作ガイド**: 初回利用時のインタラクティブチュートリアル

### 4.11 データ品質・メンテナンス
**現在の課題**: タグ分類の一貫性と品質管理

#### 提案改善
- **タグ正規化**: 表記揺れ・重複タグの統合
- **階層見直し**: より直感的な分類構造への改善
- **メタデータ充実**: タグの説明・背景情報の追加
- **品質指標**: タグ分類の有用性・正確性測定

### 4.12 分析・インサイト
**現在の課題**: タグ利用パターンの分析・活用が不足

#### 提案改善
- **利用統計**: タグ別アクセス・検索統計の可視化
- **パターン分析**: ユーザーの探索パターン分析
- **コンテンツギャップ**: 不足しているタグ・分類の特定
- **改善提案**: データに基づくタグ構造改善の自動提案

## 5. 技術的考慮事項

### 5.1 データ構造最適化
- **ツリー効率化**: 大量ノードでの描画パフォーマンス
- **メモ化**: React.memo による不要な再レンダリング防止
- **状態管理**: 複雑なツリー状態の効率的管理

### 5.2 API設計改善
- **部分取得**: 必要な階層のみの段階的データ取得
- **検索API**: タグ名での高速検索エンドポイント
- **統計API**: タグ利用統計の専用エンドポイント

### 5.3 SEO・メタデータ
- **動的URL**: 選択タグのURL反映
- **OGP対応**: タグ別のシェア情報最適化
- **構造化データ**: タグ階層のSchema.org対応
