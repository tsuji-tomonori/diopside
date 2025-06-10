# Diopside Frontend

白雪巴ファンサイトのフロントエンド - Next.js 15 + React 19 モダンWebアプリケーション

## 🎯 概要

白雪巴VTuberの配信アーカイブを管理・閲覧するためのWebフロントエンドです。Next.js 15のApp Routerを使用し、レスポンシブデザインとモダンなUXを提供します。

## 🏗️ アーキテクチャ

### 技術スタック
- **フレームワーク**: Next.js 15.x (App Router)
- **ライブラリ**: React 19.x
- **言語**: TypeScript 5.x
- **スタイリング**: Tailwind CSS 3.x
- **状態管理**: React Server Components + Client Components
- **テスト**: Jest + React Testing Library
- **パッケージ管理**: npm

### 設計原則
- **Server-First**: React Server Componentsを優先使用
- **Progressive Enhancement**: 段階的機能向上
- **Mobile-First**: モバイルファーストなレスポンシブデザイン
- **Accessibility**: WCAG 2.1 AA準拠のアクセシビリティ

## 📁 プロジェクト構成

```
frontend/
├── src/
│   ├── app/                    # App Router (Next.js 15)
│   │   ├── layout.tsx         # ルートレイアウト
│   │   ├── page.tsx           # ホームページ
│   │   ├── archives/          # アーカイブページ
│   │   ├── search/            # 検索ページ
│   │   ├── memory-game/       # メモリーゲームページ
│   │   └── globals.css        # グローバルスタイル
│   ├── components/            # Reactコンポーネント
│   │   ├── ui/               # 基本UIコンポーネント
│   │   ├── layout/           # レイアウトコンポーネント
│   │   ├── archive/          # アーカイブ関連コンポーネント
│   │   └── game/             # ゲーム関連コンポーネント
│   ├── lib/                  # ユーティリティ・設定
│   │   ├── api.ts           # API クライアント
│   │   ├── utils.ts         # ユーティリティ関数
│   │   └── types.ts         # TypeScript型定義
│   └── hooks/               # カスタムReactフック
├── public/                  # 静的ファイル
│   ├── images/             # 画像ファイル
│   └── icons/              # アイコンファイル
├── __tests__/              # テストファイル
├── next.config.ts          # Next.js設定
├── tailwind.config.ts      # Tailwind CSS設定
├── tsconfig.json          # TypeScript設定
└── package.json           # プロジェクト設定
```

## 🚀 セットアップ

### 前提条件
- Node.js 20.x以上
- npm 10.x以上

### ローカル開発環境

1. **依存関係のインストール**
```bash
cd frontend
npm install
```

2. **環境変数の設定**
```bash
# .env.local ファイルを作成
cp .env.example .env.local

# 必要な環境変数を設定
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SITE_NAME=白雪巴ファンサイト
NEXT_PUBLIC_SITE_DESCRIPTION=白雪巴VTuberの配信アーカイブサイト
```

3. **開発サーバーの起動**
```bash
# 開発サーバー（ホットリロード付き）
npm run dev

# 特定のポートで起動
npm run dev -- --port 3001
```

4. **アプリケーションの確認**
- **フロントエンド**: http://localhost:3000
- **Storybook**: http://localhost:6006 (別途起動)

## 📱 主要機能

### 1. アーカイブ閲覧
- **年別表示**: 配信年ごとのアーカイブ一覧
- **タグフィルタリング**: 階層タグによる絞り込み
- **サムネイル表示**: YouTube サムネイルの表示
- **詳細情報**: 配信時間、視聴回数、説明文

### 2. 検索機能
- **全文検索**: タイトル・説明文での検索
- **タグ検索**: 複数タグでの AND/OR 検索
- **日付範囲**: 期間指定での検索
- **ソート機能**: 日付、視聴回数、タイトルでのソート

### 3. メモリーゲーム
- **サムネイル神経衰弱**: 配信サムネイルを使った記憶ゲーム
- **難易度選択**: 4×4, 6×6, 8×8 グリッド
- **スコア記録**: ローカルストレージでのベストスコア保存
- **統計表示**: プレイ回数、成功率の表示

### 4. レスポンシブデザイン
- **モバイル対応**: スマートフォン・タブレット最適化
- **ダークモード**: システム設定に応じた自動切り替え
- **アクセシビリティ**: キーボードナビゲーション対応

## 🎨 デザインシステム

### カラーパレット
```css
/* プライマリカラー（白雪巴のイメージカラー） */
--primary-50: #f0f9ff;
--primary-500: #3b82f6;
--primary-900: #1e3a8a;

/* セカンダリカラー */
--secondary-50: #fdf4ff;
--secondary-500: #a855f7;
--secondary-900: #581c87;

/* グレースケール */
--gray-50: #f9fafb;
--gray-500: #6b7280;
--gray-900: #111827;
```

### タイポグラフィ
- **見出し**: Inter フォント（英数字）+ Noto Sans JP（日本語）
- **本文**: システムフォント優先のフォールバック
- **コード**: JetBrains Mono

### コンポーネント設計
```typescript
// 基本UIコンポーネントの例
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({ 
  variant, 
  size, 
  children, 
  ...props 
}) => {
  // 実装
};
```

## 🧪 テスト

### テスト実行
```bash
# 全テストの実行
npm test

# ウォッチモードでのテスト
npm run test:watch

# カバレッジ付きテスト
npm run test:coverage

# E2Eテスト（Playwright）
npm run test:e2e
```

### テスト構成
- **単体テスト**: コンポーネント・フック・ユーティリティ
- **統合テスト**: ページレベルの機能テスト
- **E2Eテスト**: ユーザーフローの自動テスト
- **ビジュアルテスト**: Storybook + Chromatic

### テスト例
```typescript
// コンポーネントテストの例
import { render, screen } from '@testing-library/react';
import { VideoCard } from '@/components/archive/VideoCard';

describe('VideoCard', () => {
  const mockVideo = {
    video_id: 'test123',
    title: 'テスト配信',
    tags: ['雑談'],
    year: 2024,
    thumbnail_url: 'https://example.com/thumb.jpg',
    created_at: '2024-01-01T00:00:00Z'
  };

  it('動画情報を正しく表示する', () => {
    render(<VideoCard video={mockVideo} />);
    
    expect(screen.getByText('テスト配信')).toBeInTheDocument();
    expect(screen.getByText('雑談')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'テスト配信');
  });
});
```

## 🔍 コード品質

### 品質チェック
```bash
# ESLint（リンティング）
npm run lint

# ESLint自動修正
npm run lint:fix

# TypeScript型チェック
npm run type-check

# Prettier（フォーマット）
npm run format

# 全品質チェック
npm run quality:check
```

### コーディング規約
- **ESLint**: Next.js推奨設定 + カスタムルール
- **Prettier**: 統一されたコードフォーマット
- **TypeScript**: 厳格な型チェック設定
- **Husky**: コミット前の自動品質チェック

### Git フック
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{css,scss}": ["prettier --write"]
  }
}
```

## 🚀 ビルド・デプロイ

### 本番ビルド
```bash
# 本番用ビルド
npm run build

# ビルド結果の確認
npm run start

# 静的エクスポート（S3デプロイ用）
npm run export
```

### パフォーマンス最適化
- **画像最適化**: Next.js Image コンポーネント
- **コード分割**: 動的インポートによる遅延読み込み
- **バンドル分析**: webpack-bundle-analyzer
- **キャッシュ戦略**: ISR（Incremental Static Regeneration）

### デプロイ設定
```typescript
// next.config.ts
const nextConfig = {
  output: 'export', // 静的エクスポート
  trailingSlash: true,
  images: {
    unoptimized: true, // S3デプロイ用
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};
```

## 📊 パフォーマンス

### Core Web Vitals 目標値
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### 最適化手法
- **画像遅延読み込み**: Intersection Observer API
- **仮想スクロール**: 大量データの効率的表示
- **メモ化**: React.memo, useMemo, useCallback
- **Service Worker**: オフライン対応・キャッシュ戦略

## 🛡️ セキュリティ

### セキュリティ対策
- **CSP (Content Security Policy)**: XSS攻撃の防止
- **HTTPS強制**: 本番環境での暗号化通信
- **環境変数管理**: 機密情報の適切な管理
- **依存関係監査**: npm audit による脆弱性チェック

### プライバシー保護
- **Cookie同意**: GDPR準拠のCookie管理
- **ローカルストレージ**: 最小限のデータ保存
- **アナリティクス**: プライバシー重視の設定

## 🌐 国際化（i18n）

### 多言語対応
```typescript
// lib/i18n.ts
export const locales = ['ja', 'en'] as const;
export type Locale = typeof locales[number];

export const messages = {
  ja: {
    'archive.title': 'アーカイブ',
    'search.placeholder': '検索キーワードを入力',
  },
  en: {
    'archive.title': 'Archives',
    'search.placeholder': 'Enter search keywords',
  },
};
```

### 地域化対応
- **日付フォーマット**: 地域に応じた日付表示
- **数値フォーマット**: 桁区切り文字の地域化
- **RTL対応**: 右から左に読む言語への対応準備

## 🤝 コントリビューション

### 開発フロー
1. **Issue作成**: バグ報告・機能要望
2. **ブランチ作成**: `feature/new-feature`
3. **開発**: コーディング規約に従った実装
4. **テスト**: 十分なテストカバレッジ
5. **プルリクエスト**: 詳細な説明付きでPR作成

### コードレビューポイント
- **機能性**: 要件を満たしているか
- **パフォーマンス**: 効率的な実装か
- **アクセシビリティ**: 障害者対応は適切か
- **テスト**: 適切なテストが書かれているか
- **デザイン**: デザインシステムに準拠しているか

### Storybook
```bash
# Storybookの起動
npm run storybook

# Storybookのビルド
npm run build-storybook
```

## 📱 PWA対応

### Progressive Web App機能
- **Service Worker**: オフライン対応
- **Web App Manifest**: ホーム画面追加
- **プッシュ通知**: 新着アーカイブの通知
- **バックグラウンド同期**: オフライン時のデータ同期

## 🔧 開発ツール

### 推奨VS Code拡張機能
- **ES7+ React/Redux/React-Native snippets**
- **Tailwind CSS IntelliSense**
- **TypeScript Importer**
- **Auto Rename Tag**
- **Prettier - Code formatter**
- **ESLint**

### デバッグ設定
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    }
  ]
}
```

## 📄 ライセンス

このプロジェクトはDiopside VTuberファンサイトシステムの一部です。

---

## 📞 サポート

- **Issues**: [GitHub Issues](https://github.com/tsuji-tomonori/diopside/issues)
- **Storybook**: http://localhost:6006 (開発時)
- **デザインシステム**: [Figma](https://figma.com/design-system) (内部リンク)
