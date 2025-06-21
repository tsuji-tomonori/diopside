# コーディング規約

このドキュメントでは、Diopsideプロジェクトのコーディング規約について説明します。

## 言語別規約

### TypeScript/JavaScript (Frontend)

#### フォーマットとリンティング
- **ESLint**: `.eslintrc.json`の設定に従う
- **Prettier**: 自動フォーマットを使用
- **インデント**: スペース2つ
- **セミコロン**: 必須
- **クォート**: シングルクォート使用

#### 命名規則
- **変数・関数**: camelCase (`userName`, `fetchUserData`)
- **定数**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **コンポーネント**: PascalCase (`UserProfile`, `VideoGrid`)
- **ファイル名**: kebab-case (`user-profile.tsx`, `video-grid.component.tsx`)

#### React コンポーネント
```typescript
// ✅ 良い例
interface UserProfileProps {
  userId: string;
  onUpdate: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  const [user, setUser] = useState<User | null>(null);

  return (
    <div className="user-profile">
      {/* コンポーネント内容 */}
    </div>
  );
};
```

#### Hooks
- カスタムフックは`use`で始める
- 副作用は`useEffect`で管理
- パフォーマンス最適化には`useMemo`、`useCallback`を適切に使用

### Python (Backend)

#### フォーマットとリンティング
- **Ruff**: リンティングとフォーマット
- **mypy**: 型チェック
- **インデント**: スペース4つ
- **最大行長**: 88文字

#### 命名規則
- **変数・関数**: snake_case (`user_name`, `fetch_user_data`)
- **クラス**: PascalCase (`UserService`, `VideoModel`)
- **定数**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **ファイル名**: snake_case (`user_service.py`, `video_model.py`)

#### FastAPI
```python
# ✅ 良い例
from pydantic import BaseModel
from typing import Optional

class VideoResponse(BaseModel):
    video_id: str
    title: str
    upload_date: str
    tags: list[str]

@router.get("/videos/{video_id}", response_model=VideoResponse)
async def get_video(
    video_id: str,
    include_metadata: bool = False
) -> VideoResponse:
    """指定されたIDの動画を取得"""
    video = await video_service.get_by_id(video_id)
    return VideoResponse(**video.dict())
```

#### 型ヒント
- すべての関数に型ヒントを追加
- `Optional`、`Union`、`List`などを適切に使用
- 戻り値の型も明示

### AWS CDK (Infrastructure)

#### 命名規則
- **Stack**: PascalCase (`DiopsideAppStack`)
- **Construct**: PascalCase (`DatabaseConstruct`)
- **リソース**: PascalCase + 接尾辞 (`UserTable`, `VideoFunction`)

```python
# ✅ 良い例
class DiopsideAppStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # DynamoDBテーブル
        self.video_table = dynamodb.Table(
            self, "VideoTable",
            table_name=f"{self.stack_name}-videos",
            partition_key=dynamodb.Attribute(
                name="video_id",
                type=dynamodb.AttributeType.STRING
            )
        )
```

## 共通規約

### コメント
- **日本語**: ビジネスロジックの説明
- **英語**: 技術的な詳細やライブラリに関する説明
- **JSDoc/docstring**: パブリックAPIには必須

```typescript
/**
 * ユーザーの動画視聴履歴を取得する
 * @param userId - ユーザーID
 * @param limit - 取得件数の上限（デフォルト: 10）
 * @returns 視聴履歴の配列
 */
export async function getUserWatchHistory(
  userId: string,
  limit: number = 10
): Promise<WatchHistory[]> {
  // Implementation here
}
```

### エラーハンドリング
- カスタム例外クラスを使用
- ログレベルを適切に設定
- ユーザー向けエラーメッセージは日本語

### テスト
- **命名**: `describe`と`it`は日本語でOK
- **カバレッジ**: 最低80%を維持
- **モック**: 外部依存関係は適切にモック

## コードレビュー観点

### セキュリティ
- 機密情報のハードコーディング禁止
- 入力値の適切なバリデーション
- SQL/NoSQLインジェクション対策

### パフォーマンス
- 不要な再レンダリングの回避
- データベースクエリの最適化
- 適切なキャッシュ戦略

### 可読性
- 意図が明確な命名
- 適切な抽象化レベル
- DRY原則の遵守

## ツール設定

### VSCode設定例
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "python.defaultInterpreterPath": "./venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.ruffEnabled": true
}
```

### pre-commit設定
```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.6
    hooks:
      - id: ruff
        args: [--fix, --exit-non-zero-on-fix]
  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v3.0.3
    hooks:
      - id: prettier
```

## チェックリスト

コードレビュー時は以下を確認してください：

- [ ] 命名規則に従っているか
- [ ] 適切な型定義があるか
- [ ] エラーハンドリングが実装されているか
- [ ] テストケースが網羅されているか
- [ ] ドキュメントが更新されているか
- [ ] セキュリティ要件を満たしているか
- [ ] パフォーマンスに問題がないか
