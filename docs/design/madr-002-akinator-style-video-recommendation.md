# MADR-002: Akinator式インタラクティブ配信推薦システム

## ステータス

検討中

## コンテキスト

Diopsideアーカイブサイトにおいて、ユーザーが見たい配信を直感的に発見できるよう、Akinatorのような質問応答形式のインタラクティブ推薦システムを実装する必要がある。

### 要件

- **インタラクティブ質問**: ユーザーが「はい」「いいえ」「部分的にそう」で回答
- **効率的な絞り込み**: 少ない質問数（5-10問）で1つの配信に収束
- **動的質問生成**: 残り候補に応じて最適な質問を選択
- **多様な質問軸**: 年代、ジャンル、ゲーム、コラボ、配信時間など
- **直感的UI**: 段階的に候補が絞られる様子を視覚化
- **高速レスポンス**: 各質問の応答を1秒以内で返却

### 制約

- **既存アーキテクチャ活用**: FastAPI + DynamoDB + Next.jsとの統合
- **サーバレス**: AWS Lambda中心のアーキテクチャを維持
- **データ制約**: 現在のVideo modelの属性範囲内での実装
- **低レイテンシ**: リアルタイム性を重視した応答性能

### 利用可能なデータ属性

現在のVideo modelから利用可能な絞り込み軸:
- **year** (2020-2025): 時期による絞り込み
- **tags** (階層構造): ジャンル・ゲーム・コラボ分類
- **title** (日本語): タイトルキーワード分析
- **video_id**: 個別配信識別
- **duration** (潜在): 長時間・短時間配信の分類（要DynamoDB追加）

## 検討した選択肢

### Option 1: 静的決定木 + ルールベース推薦

**アーキテクチャ:**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │ -> │  Akinator API    │ -> │ Decision Tree   │
│  (質問UI)       │    │  (FastAPI)       │    │ Lambda          │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         v
                        ┌─────────────────────────────────────────┐
                        │           DynamoDB                      │
                        │  ┌─────────────┐  ┌─────────────────┐  │
                        │  │ Videos      │  │ Question Tree   │  │
                        │  │ Table       │  │ (Static Rules)  │  │
                        │  └─────────────┘  └─────────────────┘  │
                        └─────────────────────────────────────────┘
```

**決定木構造例:**
```json
{
  "question_id": "Q001",
  "question": "2022年以降の配信ですか？",
  "question_type": "year_range",
  "filter_field": "year",
  "branches": {
    "yes": {
      "filter": {"year": {"gte": 2022}},
      "next_question": "Q002"
    },
    "no": {
      "filter": {"year": {"lt": 2022}},
      "next_question": "Q003"
    },
    "partially": {
      "filter": {"year": {"gte": 2021, "lte": 2022}},
      "next_question": "Q004"
    }
  }
}
```

**質問生成戦略:**
1. **階層1**: 年代区分 (2020-2021 vs 2022-2025)
2. **階層2**: メインカテゴリ (ゲーム実況 vs 雑談 vs コラボ)
3. **階層3**: ジャンル細分化 (ホラー vs アクション vs RPG)
4. **階層4**: 具体的ゲーム (Minecraft vs DbD vs Apex)
5. **階層5**: コラボ相手・特徴

**利点:**
- 実装が単純で高速
- 予測可能な質問パターン
- デバッグ・調整が容易
- キャッシュ効率が高い

**欠点:**
- データ分布の変化に対応困難
- 新しいタグやゲームへの対応が手動
- 最適でない質問順序の可能性
- 静的ルールの保守コスト

### Option 2: 動的情報利得最大化 + エントロピーベース推薦

**アーキテクチャ:**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │ -> │  Akinator API    │ -> │ Entropy Engine  │
│  (質問UI)       │    │  (FastAPI)       │    │ Lambda          │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         v
                        ┌─────────────────────────────────────────┐
                        │           DynamoDB + Cache              │
                        │  ┌─────────────┐  ┌─────────────────┐  │
                        │  │ Videos      │  │ ElastiCache     │  │
                        │  │ Table       │  │ (Candidates)    │  │
                        │  └─────────────┘  └─────────────────┘  │
                        └─────────────────────────────────────────┘
```

**動的質問生成アルゴリズム:**
```python
def generate_optimal_question(candidate_videos: List[Video]) -> Question:
    """情報利得最大化による最適質問生成"""

    best_question = None
    max_information_gain = 0

    # 各可能な質問軸を評価
    for question_axis in QUESTION_AXES:
        # エントロピー計算
        current_entropy = calculate_entropy(candidate_videos, question_axis)

        # 各回答でのデータ分割を評価
        expected_entropy = 0
        for answer in ["yes", "no", "partially"]:
            subset = filter_videos(candidate_videos, question_axis, answer)
            weight = len(subset) / len(candidate_videos)
            expected_entropy += weight * calculate_entropy(subset, question_axis)

        # 情報利得 = 現在エントロピー - 期待エントロピー
        information_gain = current_entropy - expected_entropy

        if information_gain > max_information_gain:
            max_information_gain = information_gain
            best_question = create_question(question_axis, candidate_videos)

    return best_question
```

**質問軸の優先度付け:**
```python
QUESTION_AXES = [
    # 高い弁別力を持つ軸
    {"type": "year_range", "weight": 1.0},
    {"type": "main_category", "weight": 0.9},  # ゲーム vs 雑談
    {"type": "collaboration", "weight": 0.8},   # ソロ vs コラボ
    {"type": "game_genre", "weight": 0.7},      # ホラー、アクション等
    {"type": "specific_game", "weight": 0.6},   # 具体的ゲームタイトル
    {"type": "duration", "weight": 0.5},        # 長時間 vs 短時間
    {"type": "collaboration_partner", "weight": 0.4}  # 特定コラボ相手
]
```

**利点:**
- データ分布に適応的
- 常に最適な質問を生成
- 新しいタグ・カテゴリに自動対応
- 理論的に最小質問数で収束

**欠点:**
- 計算処理が重い（エントロピー計算）
- リアルタイム応答への影響
- アルゴリズムの複雑性
- デバッグ困難

### Option 3: 機械学習ベース + 埋め込み類似度推薦

**アーキテクチャ:**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │ -> │  Akinator API    │ -> │ ML Inference    │
│  (質問UI)       │    │  (FastAPI)       │    │ Lambda          │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         v
                        ┌─────────────────────────────────────────┐
                        │         Storage + ML Services           │
                        │  ┌─────────────┐  ┌─────────────────┐  │
                        │  │ DynamoDB    │  │ S3 (Model)      │  │
                        │  │ (Videos)    │  │ + Embeddings    │  │
                        │  └─────────────┘  └─────────────────┘  │
                        └─────────────────────────────────────────┘
```

**ユーザー選好ベクトル構築:**
```python
class UserPreferenceBuilder:
    def __init__(self):
        self.preference_vector = np.zeros(EMBEDDING_DIM)
        self.certainty_weights = np.zeros(EMBEDDING_DIM)

    def update_preference(self, question: str, answer: str,
                         positive_examples: List[Video],
                         negative_examples: List[Video]):
        """回答に基づいてユーザー選好ベクトルを更新"""

        if answer == "yes":
            # ポジティブサンプルに近づける
            for video in positive_examples:
                self.preference_vector += video.embedding * 0.3
                self.certainty_weights += 0.3

        elif answer == "no":
            # ネガティブサンプルから遠ざける
            for video in negative_examples:
                self.preference_vector -= video.embedding * 0.3
                self.certainty_weights += 0.3

        elif answer == "partially":
            # 弱いポジティブ信号
            for video in positive_examples:
                self.preference_vector += video.embedding * 0.1
                self.certainty_weights += 0.1

    def get_similarity_scores(self, candidates: List[Video]) -> List[float]:
        """候補動画との類似度スコア算出"""
        scores = []
        for video in candidates:
            # 重み付きコサイン類似度
            weighted_preference = self.preference_vector * self.certainty_weights
            similarity = cosine_similarity(weighted_preference, video.embedding)
            scores.append(similarity)
        return scores
```

**質問生成戦略:**
```python
def generate_discriminative_question(candidates: List[Video],
                                   preference_vector: np.ndarray) -> Question:
    """弁別力の高い質問を生成"""

    # クラスタリングで候補を分割
    clusters = kmeans_clustering(candidates, n_clusters=3)

    # 最も弁別力の高いクラスタペアを選択
    best_cluster_pair = select_most_discriminative_clusters(clusters)

    # クラスタの特徴から質問を生成
    question = generate_question_from_clusters(best_cluster_pair)

    return question
```

**利点:**
- 高精度な類似性マッチング
- ユーザーの潜在的選好を学習
- セマンティックな理解
- 複雑な選好パターンに対応

**欠点:**
- ML モデルの運用複雑性
- 初期データ準備の負荷
- 計算リソースの消費
- 外部ML APIへの依存

### Option 4: ハイブリッド階層化推薦 (推奨)

**アーキテクチャ:**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │ -> │  Akinator API    │ -> │ Hybrid Engine   │
│  (質問UI)       │    │  (FastAPI)       │    │ Lambda          │
│   ┌─────────────┤    └──────────────────┘    └─────────────────┘
│   │ Candidate   │                                      │
│   │ Visualizer  │                                      v
│   └─────────────┤            ┌─────────────────────────────────────────┐
└─────────────────┘            │         Multi-Layer Engine              │
                               │  ┌─────────────┐  ┌─────────────────┐  │
                               │  │ Rule Engine │  │ Entropy Engine  │  │
                               │  │ (Fast)      │  │ (Adaptive)      │  │
                               │  └─────────────┘  └─────────────────┘  │
                               │           │                │           │
                               │           v                v           │
                               │  ┌─────────────┐  ┌─────────────────┐  │
                               │  │ DynamoDB    │  │ ElastiCache     │  │
                               │  │ (Videos)    │  │ (Sessions)      │  │
                               │  └─────────────┘  └─────────────────┘  │
                               └─────────────────────────────────────────┘
```

**3段階ハイブリッド戦略:**

**Phase 1: 高速ルールベース絞り込み (候補数 > 100)**
```python
COARSE_GRAINED_RULES = [
    {
        "question": "2022年以降の配信ですか？",
        "filter": {"field": "year", "operator": "gte", "value": 2022},
        "expected_reduction": 0.4  # 候補を40%に削減
    },
    {
        "question": "ゲーム実況の配信ですか？",
        "filter": {"field": "tags", "operator": "contains", "value": "ゲーム実況"},
        "expected_reduction": 0.6
    },
    {
        "question": "誰かとコラボしている配信ですか？",
        "filter": {"field": "tags", "operator": "contains_any",
                  "value": ["コラボ", "#Crossick"]},
        "expected_reduction": 0.3
    }
]
```

**Phase 2: 動的エントロピー最適化 (候補数 10-100)**
```python
def dynamic_question_selection(candidates: List[Video]) -> Question:
    """中段階での動的質問生成"""

    # タグ分布分析
    tag_distribution = analyze_tag_distribution(candidates)

    # 最大分割効果の軸を選択
    best_axis = None
    max_split_effectiveness = 0

    for tag_category in tag_distribution:
        split_effectiveness = calculate_split_effectiveness(
            candidates, tag_category
        )
        if split_effectiveness > max_split_effectiveness:
            max_split_effectiveness = split_effectiveness
            best_axis = tag_category

    return create_question_for_axis(best_axis, candidates)
```

**Phase 3: ファイナル選択 (候補数 < 10)**
```python
def final_selection_strategy(candidates: List[Video]) -> Union[Question, Video]:
    """最終絞り込み戦略"""

    if len(candidates) == 1:
        return candidates[0]  # 発見完了

    elif len(candidates) <= 3:
        # 直接選択肢提示
        return create_direct_choice_question(candidates)

    else:
        # 最も特徴的な属性で最終分割
        distinctive_feature = find_most_distinctive_feature(candidates)
        return create_final_question(distinctive_feature, candidates)
```

**セッション状態管理:**
```python
class AkinatorSession:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.candidate_videos: List[Video] = []
        self.question_history: List[QA] = []
        self.current_phase: str = "coarse"  # coarse, dynamic, final
        self.confidence_score: float = 0.0

    def process_answer(self, question_id: str, answer: str) -> Union[Question, Video]:
        """回答処理と次質問生成"""

        # 候補絞り込み
        self.candidate_videos = self.apply_filter(question_id, answer)

        # 質問履歴更新
        self.question_history.append(QA(question_id, answer))

        # フェーズ判定
        if len(self.candidate_videos) > 100:
            self.current_phase = "coarse"
            return self.generate_coarse_question()
        elif len(self.candidate_videos) > 10:
            self.current_phase = "dynamic"
            return self.generate_dynamic_question()
        else:
            self.current_phase = "final"
            return self.generate_final_question()
```

**利点:**
- **高速レスポンス**: 初期段階のルールベース処理
- **最適化**: 中間段階でのエントロピー最大化
- **確実性**: 最終段階での精密絞り込み
- **拡張性**: 各フェーズの独立改善が可能
- **バランス**: 速度と精度の最適バランス

**欠点:**
- **実装複雑性**: 3つのエンジンの統合
- **調整コスト**: フェーズ移行閾値の最適化
- **状態管理**: セッション状態の一貫性保持

## 決定

**Option 4: ハイブリッド階層化推薦** を採用する。

### 理由

1. **段階的最適化**: 候補数に応じた最適なアルゴリズム選択
2. **高速レスポンス**: 初期段階での高速ルールベース処理
3. **精度保証**: 動的最適化による効率的絞り込み
4. **拡張性**: 各段階の独立改善・置換が可能
5. **実装現実性**: 段階的開発によるリスク軽減
6. **既存システム統合**: DynamoDB + FastAPIとの自然な統合

## 実装計画

### Phase 1: 基盤実装 (2週間)

**1.1 データモデル拡張**
```python
# DynamoDB拡張
class AkinatorSession(BaseModel):
    session_id: str
    user_id: str | None
    candidate_video_ids: List[str]
    question_history: List[Dict]
    current_phase: str
    created_at: str
    expires_at: str

class QuestionTemplate(BaseModel):
    question_id: str
    question_text: str
    question_type: str
    filter_condition: Dict
    phase: str
    expected_reduction_rate: float
```

**1.2 API エンドポイント**
```python
# FastAPI ルート追加
@router.post("/akinator/start")
async def start_akinator_session() -> AkinatorSessionResponse

@router.post("/akinator/{session_id}/answer")
async def process_answer(session_id: str, answer: AnswerRequest) -> QuestionResponse

@router.get("/akinator/{session_id}/candidates")
async def get_current_candidates(session_id: str) -> CandidatesResponse

@router.delete("/akinator/{session_id}")
async def end_session(session_id: str) -> SuccessResponse
```

**1.3 フロントエンド基盤**
- Akinator UI コンポーネント
- セッション状態管理
- 候補数の可視化

### Phase 2: ルールベースエンジン (1週間)

**2.1 質問テンプレート定義**
```json
{
  "coarse_questions": [
    {
      "id": "Q001",
      "text": "2022年以降の配信ですか？",
      "type": "year_range",
      "filter": {"year": {"$gte": 2022}}
    },
    {
      "id": "Q002",
      "text": "ゲーム実況の配信ですか？",
      "type": "tag_contains",
      "filter": {"tags": {"$contains": "ゲーム実況"}}
    }
  ]
}
```

**2.2 絞り込みロジック実装**
- DynamoDB クエリ最適化
- 候補数推定アルゴリズム
- ルール適用エンジン

### Phase 3: 動的エントロピーエンジン (2週間)

**3.1 エントロピー計算**
```python
def calculate_information_gain(candidates: List[Video],
                             question_axis: str) -> float:
    """情報利得計算アルゴリズム"""

    # 現在のエントロピー
    current_entropy = calculate_entropy(candidates)

    # 質問による分割後の期待エントロピー
    expected_entropy = 0
    for answer in ["yes", "no", "partially"]:
        subset = apply_question_filter(candidates, question_axis, answer)
        weight = len(subset) / len(candidates)
        subset_entropy = calculate_entropy(subset)
        expected_entropy += weight * subset_entropy

    return current_entropy - expected_entropy
```

**3.2 動的質問生成**
- タグ分布分析
- 分割効果予測
- 最適質問選択

**3.3 キャッシュ戦略**
- ElastiCache統合
- セッション状態永続化
- 計算結果キャッシュ

### Phase 4: 最終選択エンジン (1週間)

**4.1 ファイナル質問戦略**
```python
def create_final_discriminative_question(candidates: List[Video]) -> Question:
    """2-5個の候補から最終選択のための質問生成"""

    # 最も特徴的な差異を抽出
    distinctive_features = extract_distinctive_features(candidates)

    # 最大分離効果の特徴を選択
    best_feature = max(distinctive_features, key=lambda f: f.discriminative_power)

    return Question(
        text=f"{best_feature.description}ですか？",
        filter_condition=best_feature.filter,
        type="final_discriminative"
    )
```

**4.2 直接選択機能**
- 候補動画一覧表示
- 「この中にありますか？」オプション
- 手動選択フォールバック

### Phase 5: UI/UX 最適化 (1週間)

**5.1 プログレッシブ表示**
```tsx
const AkinatorInterface = () => {
  return (
    <div className="akinator-container">
      <QuestionCard
        question={currentQuestion}
        onAnswer={handleAnswer}
      />
      <CandidateCounter
        count={candidateCount}
        total={totalVideos}
      />
      <ProgressBar
        progress={getProgress(candidateCount)}
      />
      <CandidatePreview
        candidates={currentCandidates.slice(0, 3)}
      />
    </div>
  )
}
```

**5.2 アニメーション・フィードバック**
- 質問トランジション
- 候補数減少アニメーション
- 発見完了エフェクト

## 結果

この実装により以下が実現される:

### 機能的結果
- **効率的発見**: 平均5-7問で目的の配信に到達
- **直感的操作**: 3択での簡単な質問応答
- **高速レスポンス**: 各質問への応答を1秒以内で返却
- **段階的絞り込み**: 候補数の可視化による進捗感

### 技術的結果
- **スケーラブル**: データ量増加に対応可能なアーキテクチャ
- **保守性**: 段階的エンジンによる独立改善
- **拡張性**: 新しい質問軸・アルゴリズムの追加が容易
- **統合性**: 既存システムとの自然な統合

### ユーザー体験結果
- **発見の楽しさ**: ゲーム感覚での配信探索
- **偶然の出会い**: 予期しない配信の発見
- **学習効果**: 配信カテゴリの理解向上
- **時短効果**: ブラウジング時間の大幅短縮

## 補足

### パフォーマンス最適化

**キャッシュ戦略:**
- **L1キャッシュ**: Lambda メモリ内キャッシュ (10秒)
- **L2キャッシュ**: ElastiCache (5分)
- **L3キャッシュ**: DynamoDB DAX (30分)

**計算最適化:**
```python
# エントロピー計算の最適化
@lru_cache(maxsize=1000)
def calculate_entropy_cached(video_ids_tuple: Tuple[str, ...]) -> float:
    """候補IDリストのハッシュベースキャッシュ"""
    candidates = [get_video_by_id(vid) for vid in video_ids_tuple]
    return calculate_entropy(candidates)
```

### 段階的改善計画

**短期改善 (1ヶ月後):**
- 質問テンプレートの A/B テスト
- ユーザー行動分析による最適化
- エラーケース対応強化

**中期改善 (3ヶ月後):**
- ML ベース質問生成の部分導入
- ユーザー選好学習機能
- クロスセッション学習

**長期改善 (6ヶ月後):**
- 自然言語質問生成
- 音声入力対応
- 協調フィルタリング統合

### 代替技術検討

**将来的な技術選択肢:**
- **LLM 統合**: GPT-4 API による自然言語質問生成
- **グラフDB**: Neo4j による関係性ベース推薦
- **リアルタイム ML**: SageMaker による動的モデル更新
- **音声対話**: Whisper + Speech Synthesis API

### コスト見積り

**月額運用コスト:**
- **DynamoDB**: $30-50 (セッション + クエリ)
- **Lambda**: $20-40 (計算処理)
- **ElastiCache**: $30-60 (セッションキャッシュ)
- **CloudFront**: $5-15 (UI配信)
- **合計**: $85-165/月

**開発コスト:**
- **Phase 1-2**: 3週間 (基盤 + ルールエンジン)
- **Phase 3**: 2週間 (動的エンジン)
- **Phase 4-5**: 2週間 (最終選択 + UI)
- **合計**: 7週間の開発期間
