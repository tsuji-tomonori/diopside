# コントリビューションガイド

白雪巴ファンサイト（Diopside）プロジェクトへのコントリビューション方法

## 🎯 はじめに

Diopsideプロジェクトへのコントリビューションを検討していただき、ありがとうございます！このガイドでは、プロジェクトに貢献するための手順とガイドラインを説明します。

## 🤝 コントリビューションの種類

### 1. バグ報告
- アプリケーションの不具合
- ドキュメントの誤り
- パフォーマンスの問題

### 2. 機能提案
- 新機能のアイデア
- 既存機能の改善提案
- UX/UIの改善案

### 3. コード貢献
- バグ修正
- 新機能の実装
- パフォーマンス改善
- テストの追加

### 4. ドキュメント改善
- README の更新
- API ドキュメントの改善
- チュートリアルの作成

## 🚀 開発環境のセットアップ

### 前提条件
- **Git**: バージョン管理
- **Node.js**: 20.x以上（フロントエンド）
- **Python**: 3.13以上（バックエンド・インフラ）
- **uv**: Python パッケージマネージャー
- **AWS CLI**: インフラ開発時

### リポジトリのフォーク・クローン

```bash
# 1. GitHubでリポジトリをフォーク
# https://github.com/tsuji-tomonori/diopside/fork

# 2. フォークしたリポジトリをクローン
git clone https://github.com/YOUR_USERNAME/diopside.git
cd diopside

# 3. 上流リポジトリをリモートに追加
git remote add upstream https://github.com/tsuji-tomonori/diopside.git

# 4. 上流の変更を取得
git fetch upstream
```

### 各コンポーネントのセットアップ

#### フロントエンド
```bash
cd frontend
npm install
npm run dev
```

#### バックエンド
```bash
cd backend
uv sync --dev
uv run python main.py
```

#### インフラ
```bash
cd infrastructure
uv sync --dev
uv run pytest
```

## 📋 開発フロー

### 1. Issue の作成・確認

新しい機能やバグ修正を始める前に、関連する Issue を確認または作成してください。

```bash
# Issue テンプレートを使用
- Bug Report
- Feature Request
- Documentation Improvement
```

### 2. ブランチの作成

```bash
# 最新の main ブランチから開始
git checkout main
git pull upstream main

# 機能ブランチを作成
git checkout -b feature/your-feature-name
# または
git checkout -b fix/bug-description
```

### ブランチ命名規則
- `feature/機能名`: 新機能の追加
- `fix/修正内容`: バグ修正
- `docs/ドキュメント名`: ドキュメント更新
- `refactor/リファクタリング内容`: コードリファクタリング
- `test/テスト内容`: テストの追加・修正

### 3. 開発・テスト

#### コーディング規約

**Python (バックエンド・インフラ)**
```bash
# コード品質チェック
uv run ruff check .
uv run ruff format .
uv run mypy .

# テスト実行
uv run pytest
```

**TypeScript (フロントエンド)**
```bash
# コード品質チェック
npm run lint
npm run lint:fix
npm run type-check

# テスト実行
npm test
```

#### コミット規約

[Conventional Commits](https://www.conventionalcommits.org/) 形式を使用：

```bash
# 形式: <type>(<scope>): <description>

# 例:
git commit -m "feat(frontend): add video search functionality"
git commit -m "fix(backend): resolve API timeout issue"
git commit -m "docs(readme): update installation instructions"
git commit -m "test(backend): add unit tests for video service"
```

**コミットタイプ:**
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント更新
- `style`: コードスタイル修正
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: その他の変更

### 4. プルリクエストの作成

```bash
# 変更をプッシュ
git push origin feature/your-feature-name

# GitHub でプルリクエストを作成
# https://github.com/YOUR_USERNAME/diopside/compare
```

#### プルリクエストテンプレート

```markdown
## 概要
<!-- 変更内容の簡潔な説明 -->

## 変更内容
<!-- 具体的な変更点をリストアップ -->
- [ ] 機能A を追加
- [ ] バグB を修正
- [ ] テストC を追加

## 関連Issue
<!-- 関連するIssue番号 -->
Closes #123

## テスト
<!-- テスト方法・結果 -->
- [ ] 単体テスト通過
- [ ] 統合テスト通過
- [ ] 手動テスト完了

## スクリーンショット
<!-- UI変更がある場合 -->

## チェックリスト
- [ ] コーディング規約に準拠
- [ ] テストを追加・更新
- [ ] ドキュメントを更新
- [ ] 破壊的変更がある場合は明記
```

## 🔍 コードレビュープロセス

### レビュー観点

1. **機能性**: 要件を満たしているか
2. **コード品質**: 読みやすく保守しやすいか
3. **パフォーマンス**: 効率的な実装か
4. **セキュリティ**: 脆弱性はないか
5. **テスト**: 適切なテストが書かれているか
6. **ドキュメント**: 必要な文書が更新されているか

### レビュー後の対応

```bash
# フィードバックに基づく修正
git add .
git commit -m "fix: address review comments"
git push origin feature/your-feature-name

# 必要に応じてリベース
git rebase -i HEAD~n
```

## 🧪 テストガイドライン

### フロントエンド テスト

```typescript
// コンポーネントテストの例
import { render, screen } from '@testing-library/react';
import { VideoCard } from '@/components/VideoCard';

describe('VideoCard', () => {
  it('should display video information correctly', () => {
    const mockVideo = {
      video_id: 'test123',
      title: 'テスト動画',
      tags: ['テスト'],
      year: 2024,
      thumbnail_url: 'https://example.com/thumb.jpg',
      created_at: '2024-01-01T00:00:00Z'
    };

    render(<VideoCard video={mockVideo} />);
    
    expect(screen.getByText('テスト動画')).toBeInTheDocument();
    expect(screen.getByText('テスト')).toBeInTheDocument();
  });
});
```

### バックエンド テスト

```python
# APIテストの例
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_videos():
    response = client.get("/api/videos?year=2024")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert isinstance(data["items"], list)
```

### インフラ テスト

```python
# CDKスタックテストの例
import aws_cdk as cdk
from aws_cdk import assertions
from stacks.dev_stack import DevStack

def test_s3_bucket_created():
    app = cdk.App()
    stack = DevStack(app, "TestStack")
    template = assertions.Template.from_stack(stack)
    
    template.has_resource_properties("AWS::S3::Bucket", {
        "VersioningConfiguration": {
            "Status": "Enabled"
        }
    })
```

## 📚 ドキュメント作成ガイドライン

### README 更新

- 新機能追加時は使用方法を追記
- 設定変更時は設定例を更新
- 依存関係変更時は前提条件を更新

### API ドキュメント

```python
# FastAPI での自動ドキュメント生成
@router.get("/videos", response_model=VideoListResponse)
async def get_videos(
    year: int = Query(..., description="取得する年"),
    limit: int = Query(20, description="取得件数", ge=1, le=100),
    offset: int = Query(0, description="オフセット", ge=0)
) -> VideoListResponse:
    """
    指定された年の動画一覧を取得します。
    
    Args:
        year: 取得する年
        limit: 取得件数（1-100）
        offset: オフセット
    
    Returns:
        VideoListResponse: 動画一覧とメタデータ
    """
```

### コードコメント

```typescript
/**
 * 動画カードコンポーネント
 * 
 * @param video - 表示する動画データ
 * @param onClick - クリック時のコールバック関数
 * @returns JSX.Element
 */
const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  // 実装
};
```

## 🛡️ セキュリティガイドライン

### 脆弱性報告

セキュリティに関する問題を発見した場合：

1. **公開Issue は作成しない**
2. **メンテナーに直接連絡**
3. **詳細な再現手順を提供**
4. **修正まで情報を非公開に保つ**

### セキュアコーディング

```python
# 入力検証の例
from pydantic import BaseModel, validator

class VideoCreate(BaseModel):
    title: str
    video_url: str
    
    @validator('title')
    def validate_title(cls, v):
        if len(v.strip()) == 0:
            raise ValueError('タイトルは必須です')
        if len(v) > 200:
            raise ValueError('タイトルは200文字以内で入力してください')
        return v.strip()
```

## 🎨 デザインガイドライン

### UI/UX 原則

1. **アクセシビリティ**: WCAG 2.1 AA準拠
2. **レスポンシブデザイン**: モバイルファースト
3. **パフォーマンス**: Core Web Vitals 最適化
4. **一貫性**: デザインシステムの遵守

### コンポーネント設計

```typescript
// 再利用可能なコンポーネントの例
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
}) => {
  // 実装
};
```

## 🚀 リリースプロセス

### バージョニング

[Semantic Versioning](https://semver.org/) を使用：

- **MAJOR**: 破壊的変更
- **MINOR**: 後方互換性のある機能追加
- **PATCH**: 後方互換性のあるバグ修正

### リリースノート

```markdown
## [1.2.0] - 2024-01-15

### Added
- 新しい検索フィルター機能
- メモリーゲームの難易度選択

### Changed
- API レスポンス形式の改善
- UI デザインの更新

### Fixed
- 動画読み込み時のエラー処理
- モバイル表示の不具合

### Security
- 入力検証の強化
```

## 📞 コミュニケーション

### 質問・相談

- **GitHub Issues**: バグ報告・機能要望
- **GitHub Discussions**: 一般的な質問・議論
- **プルリクエスト**: コードレビュー・技術的議論

### コミュニティガイドライン

1. **敬意を持って**: 建設的で礼儀正しいコミュニケーション
2. **包括性**: 多様な背景を持つ人々を歓迎
3. **協力的**: 互いに学び、成長する姿勢
4. **透明性**: オープンで誠実なコミュニケーション

## 🏆 コントリビューター認定

### 貢献レベル

1. **First-time Contributor**: 初回コントリビューション
2. **Regular Contributor**: 継続的な貢献
3. **Core Contributor**: 重要な機能開発・メンテナンス
4. **Maintainer**: プロジェクト管理・方向性決定

### 認定基準

- **コード品質**: 高品質なコードの継続的な提供
- **コミュニティ参加**: Issue・PR での積極的な参加
- **メンテナンス**: バグ修正・ドキュメント更新
- **リーダーシップ**: 新規コントリビューターのサポート

---

## 🙏 謝辞

Diopsideプロジェクトは、コミュニティの皆様の貢献によって成り立っています。あなたの参加を心よりお待ちしています！

## 📄 ライセンス

このプロジェクトへのコントリビューションは、プロジェクトのライセンス条項に従います。

---

**Happy Contributing! 🎉**