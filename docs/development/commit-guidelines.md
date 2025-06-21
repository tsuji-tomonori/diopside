# コミットメッセージガイドライン

このドキュメントでは、Diopsideプロジェクトでのコミットメッセージの書き方について説明します。

## 基本形式

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Type（必須）

コミットの種類を表します：

| Type | 説明 | 例 |
|------|------|-----|
| `feat` | 新機能 | `feat(api): 動画のタグ検索機能を追加` |
| `fix` | バグ修正 | `fix(web): 動画プレイヤーの再生ボタンが動作しない問題を修正` |
| `docs` | ドキュメントのみの変更 | `docs: README.mdにインストール手順を追加` |
| `style` | コードの意味に影響しない変更（空白、フォーマット、セミコロンなど） | `style(api): コードフォーマットを修正` |
| `refactor` | バグ修正や新機能追加ではないコードの変更 | `refactor(web): ユーザー認証ロジックをカスタムフックに分離` |
| `perf` | パフォーマンスを向上させる変更 | `perf(api): データベースクエリを最適化` |
| `test` | テストの追加や修正 | `test(web): VideoGridコンポーネントのテストを追加` |
| `chore` | ビルドプロセス、補助ツール、ライブラリの変更 | `chore: dependenciesを最新バージョンに更新` |
| `ci` | CI設定ファイルやスクリプトの変更 | `ci: GitHub Actionsワークフローを追加` |
| `build` | ビルドシステムや外部依存関係に影響する変更 | `build: webpackの設定を更新` |
| `revert` | 以前のコミットを取り消す | `revert: "feat(api): 動画のタグ検索機能を追加"` |

## Scope（任意）

変更の影響範囲を示します：

### プロジェクト全体
- `web` - フロントエンド（Next.js）
- `api` - バックエンド（FastAPI）
- `infra` - インフラ（CDK）
- `scripts` - ユーティリティスクリプト

### 機能別
- `auth` - 認証関連
- `video` - 動画関連
- `tag` - タグ関連
- `search` - 検索関連
- `ui` - UI コンポーネント
- `db` - データベース関連

### 例
```
feat(web/video): 動画詳細ページにコメント機能を追加
fix(api/auth): トークンの有効期限チェックロジックを修正
docs(infra): CDKデプロイ手順を更新
```

## Subject（必須）

- **命令調**で記述（「追加する」ではなく「追加」）
- **50文字以内**に収める
- **日本語**で記述
- **末尾にピリオドは不要**
- **何が変わるかを明確に記述**

### 良い例
```
feat(api): 動画のタグ検索機能を追加
fix(web): ダークモード切り替え時のちらつきを修正
docs: 開発環境セットアップ手順を更新
```

### 悪い例
```
feat: いろいろ修正した  # 具体性がない
fix: bug fixed  # 英語で書かれている
feat(api): 動画のタグで検索できるようにする機能を追加しました  # 長すぎる、命令調でない
```

## Body（任意）

- **何を変更したか**と**なぜ変更したか**を説明
- **72文字で折り返し**
- **複数段落でも可**
- **箇条書きも可能**

### 例
```
feat(api): 動画のタグ検索機能を追加

ユーザーが興味のある動画を見つけやすくするため、
タグベースの検索機能を実装。

- 階層化されたタグ構造に対応
- AND/OR検索をサポート
- ページネーション機能付き
- レスポンス時間を500ms以下に最適化

既存の全文検索と組み合わせて使用可能。
```

## Footer（任意）

### Issue参照
```
Closes #123
Fixes #456
Resolves #789
```

### 複数のIssue
```
Closes #123, #456
```

### 関連Issue
```
See also #123, #456
```

### 破壊的変更
```
BREAKING CHANGE: APIのレスポンス形式が変更されました

以前: { videos: [...] }
現在: { data: [...], pagination: {...} }
```

### 共同作業者
```
Co-authored-by: Name <email@example.com>
```

## 実例

### 新機能追加
```
feat(web): メモリーゲーム機能を追加

動画のサムネイルを使ったメモリーゲームを実装。
ユーザーエンゲージメント向上を目的とする。

- 4x4グリッドでのペア揃えゲーム
- スコア機能とランキング表示
- レスポンシブデザイン対応
- ゲーム終了時のシェア機能

Closes #45
```

### バグ修正
```
fix(api): DynamoDB接続エラーのリトライ処理を修正

一時的なネットワークエラー時にAPIが完全に停止する
問題を修正。指数バックオフでのリトライを実装。

- 最大3回まで自動リトライ
- 1秒、2秒、4秒の間隔
- エラーログの詳細化

Fixes #67
```

### リファクタリング
```
refactor(web): 状態管理をZustandに移行

Contextベースの状態管理から、より軽量で
型安全なZustandに移行してパフォーマンスを改善。

- バンドルサイズ15%削減
- TypeScript型安全性の向上
- テストの簡素化

Breaking Change: useConfigフックのAPIが変更されました
```

### ドキュメント更新
```
docs: API仕様書にタグ検索エンドポイントを追加

新しく実装されたタグ検索APIの仕様を文書化。
リクエスト・レスポンス例とエラーコードを含む。

Related to #123
```

### 依存関係更新
```
chore: Next.js v14にアップデート

パフォーマンス向上とセキュリティ修正のため
Next.js を v13.5 から v14.0 にアップデート。

- App Routerの安定性向上
- ビルド時間20%短縮
- セキュリティ脆弱性2件修正

Migration guide: docs/development/nextjs-v14-migration.md
```

## Git設定

### コミットテンプレートの設定
```bash
git config commit.template .gitmessage
```

### エディタ設定
```bash
git config core.editor "code --wait"  # VS Code
git config core.editor "vim"          # Vim
```

### コミットメッセージの確認
```bash
git log --oneline -10
git show --format=fuller
```

## ベストプラクティス

### 1. アトミックなコミット
- **1つのコミットは1つの論理的変更**
- 複数の問題を同時に修正しない
- テストが通る状態でコミット

### 2. 意味のあるコミット
```bash
# ❌ 悪い例
git commit -m "WIP"
git commit -m "fix"
git commit -m "update"

# ✅ 良い例
git commit -m "feat(api): ユーザー認証機能を追加"
git commit -m "fix(web): ログインフォームのバリデーションを修正"
git commit -m "test: ユーザー登録のE2Eテストを追加"
```

### 3. コミット前チェック
```bash
# リンティング
moon run :lint

# テスト実行
moon run :test

# 型チェック
moon run api:typecheck
```

### 4. 履歴の整理
```bash
# インタラクティブリベース（コミット履歴整理）
git rebase -i HEAD~3

# 作業中コミットをまとめる
git commit --fixup <commit-hash>
git rebase -i --autosquash HEAD~n
```

## ツール連携

### VS Code拡張機能
- **Conventional Commits**: コミットメッセージの自動補完
- **GitLens**: Git履歴の可視化
- **Git History**: グラフィカルな履歴表示

### GitHub連携
- PRタイトルはコミットメッセージ形式に従う
- `Closes #123` でIssueの自動クローズ
- GitHub Actionsでコミットメッセージの検証

### Commitizen設定例
```json
{
  "config": {
    "commitizen": {
      "path": "cz-conventional-changelog"
    }
  }
}
```

## 関連ドキュメント
- [プルリクエストガイド](./pull-request-guide.md)
- [レビューチェックリスト](./review-checklist.md)
- [ブランチ戦略](./branching-strategy.md)