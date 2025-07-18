# レビューチェックリスト

このドキュメントでは、プルリクエストレビュー時の確認項目について詳しく説明します。

## 作成者向けチェックリスト

### 1. コードがプロジェクトのコーディング規約に従っている

**確認項目:**
- [ ] [コーディング規約](./coding-standards.md)に従った命名規則
- [ ] 適切なインデントとフォーマット
- [ ] リンター（ESLint/Ruff）でエラーがない
- [ ] 型チェック（TypeScript/mypy）が通る
- [ ] 未使用のimportや変数がない

**自動チェック:**
```bash
# フロントエンド
moon run web:lint
moon run web:test

# バックエンド
moon run api:lint
moon run api:test

# 全体
moon run :lint
moon run :test
```

### 2. コードの自己レビューを完了

**確認観点:**
- [ ] ビジネス要件を満たしているか
- [ ] エッジケースを考慮しているか
- [ ] エラーハンドリングが適切か
- [ ] パフォーマンスに問題がないか
- [ ] セキュリティホールがないか

**レビュー方法:**
1. GitHubの「Files changed」タブで差分を確認
2. 各行にコメントを付けて問題点を洗い出し
3. 必要に応じてリファクタリング実施

### 3. ドキュメントを更新（必要な場合）

**更新対象:**
- [ ] API仕様変更 → `docs/design/api-reference.md`
- [ ] 新機能追加 → `README.md`の使用方法
- [ ] 設定変更 → `docs/user-docs/installation.md`
- [ ] アーキテクチャ変更 → `docs/design/architecture.md`
- [ ] 運用変更 → `docs/operations/deployment.md`

**更新基準:**
- 外部ユーザーに影響する変更
- 新しい環境変数や設定項目
- API仕様の変更
- デプロイ手順の変更

### 4. 破壊的変更がない（または文書化されている）

**破壊的変更の例:**
- APIの削除・名前変更
- 必須パラメータの追加
- レスポンス形式の変更
- 環境変数の削除・名前変更
- データベーススキーマ変更

**文書化方法:**
```markdown
## 🚨 破壊的変更

### API変更
- `GET /api/videos` のレスポンス形式が変更されました
- 旧: `{ videos: [...] }`
- 新: `{ data: [...], pagination: {...} }`

### 移行手順
1. フロントエンドの型定義を更新
2. API呼び出し部分を修正
3. テストケースを更新
```

### 5. コミットメッセージが規約に従っている

**形式:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**例:**
```
feat(api): 動画のタグ検索機能を追加

タグの階層構造に対応した検索APIを実装。
複数タグでのAND/OR検索が可能。

Closes #123
```

**確認コマンド:**
```bash
git log --oneline -10
```

## レビュアー向けチェックリスト

### 1. コード品質が許容できる

**確認項目:**
- [ ] **可読性**: 命名が適切で意図が明確
- [ ] **保守性**: 適切な抽象化レベル
- [ ] **再利用性**: 共通化できる部分が適切に分離
- [ ] **拡張性**: 将来の変更に対応しやすい設計

**チェックポイント:**
```typescript
// ❌ 悪い例
const d = new Date();
const u = await fetch('/api/users').then(r => r.json());

// ✅ 良い例
const currentDate = new Date();
const users = await fetchUsers();
```

### 2. テストが適切

**確認項目:**
- [ ] **カバレッジ**: 重要なパスがテストされている
- [ ] **エッジケース**: 境界値やエラーケースを含む
- [ ] **可読性**: テストの意図が明確
- [ ] **独立性**: テスト間で依存関係がない

**テストパターン:**
```javascript
describe('動画検索機能', () => {
  it('正常系: キーワードで検索できる', async () => {
    // Arrange, Act, Assert
  });

  it('異常系: 空のキーワードでエラーになる', async () => {
    // エラーケースのテスト
  });

  it('境界値: 最大長のキーワードで検索できる', async () => {
    // 境界値テスト
  });
});
```

### 3. ドキュメントが更新されている

**確認方法:**
- [ ] 変更内容とドキュメントの整合性
- [ ] リンクが正しく機能する
- [ ] 例示コードが動作する
- [ ] 日本語の表記統一

### 4. 破壊的変更が許容できる・文書化されている

**評価基準:**
- [ ] **必要性**: 破壊的変更が本当に必要か
- [ ] **影響範囲**: どの程度のユーザーに影響するか
- [ ] **移行コスト**: 移行の難易度は適切か
- [ ] **代替案**: より良い方法がないか

## セキュリティチェック

### 共通項目
- [ ] 機密情報のハードコーディングなし
- [ ] 適切な入力値検証
- [ ] 認証・認可の実装
- [ ] ログに機密情報を出力していない

### フロントエンド
- [ ] XSS対策（サニタイゼーション）
- [ ] CSRF対策
- [ ] 機密データの適切な扱い

### バックエンド
- [ ] SQLインジェクション対策
- [ ] 適切な権限制御
- [ ] レート制限の実装

### インフラ
- [ ] IAMポリシーの最小権限
- [ ] セキュリティグループの適切な設定
- [ ] 暗号化の実装

## パフォーマンスチェック

### フロントエンド
- [ ] 不要な再レンダリングなし
- [ ] 適切なメモ化
- [ ] バンドルサイズの確認
- [ ] レイジーローディングの活用

### バックエンド
- [ ] データベースクエリの最適化
- [ ] N+1問題の回避
- [ ] 適切なキャッシュ戦略
- [ ] 非同期処理の活用

### インフラ
- [ ] リソースサイズの適正化
- [ ] CDNの活用
- [ ] 監視・アラートの設定

## レビューのベストプラクティス

### レビュアー心得
1. **建設的**: 問題点だけでなく改善案も提示
2. **明確**: 何が問題で、なぜ修正が必要かを説明
3. **優先度**: 必須の修正と推奨の修正を区別
4. **学習機会**: 新しい知識や技術の共有

### コメント例
```markdown
# ✅ 良いコメント
この実装だと N+1 問題が発生する可能性があります。
`include` を使って関連データを一括取得することを検討してください。

参考: https://example.com/n-plus-one-solution

# ❌ 悪いコメント
ここ問題あり
```

### 承認基準
以下がすべて満たされた場合に承認：
- [ ] 機能要件を満たしている
- [ ] コード品質が基準以上
- [ ] テストが十分
- [ ] ドキュメントが更新済み
- [ ] セキュリティリスクがない
- [ ] パフォーマンス問題がない

## 関連ドキュメント
- [コーディング規約](./coding-standards.md)
- [テストガイド](./testing-guide.md)
- [デプロイメント手順](../operations/deployment.md)
