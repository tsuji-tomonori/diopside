# Testing Guide

## テスト戦略

Diopsideプロジェクトでは、品質保証のため以下のテスト戦略を採用しています。

## テストレベル

### 1. Unit Tests（単体テスト）

#### フロントエンド（React/Next.js）
```bash
# テスト実行
cd package/web
npm test

# カバレッジレポート
npm run test:coverage

# Watch モード
npm run test:watch
```

**テスト対象:**
- React コンポーネント
- カスタムフック
- ユーティリティ関数

**使用ツール:**
- Jest
- React Testing Library
- @testing-library/user-event

#### バックエンド（FastAPI）
```bash
# テスト実行
cd package/api
uv run pytest

# カバレッジレポート
uv run pytest --cov=app

# 特定のテストファイル実行
uv run pytest tests/test_videos.py
```

**テスト対象:**
- API エンドポイント
- DynamoDB サービス
- データモデル

**使用ツール:**
- pytest
- FastAPI TestClient
- moto（AWS モック）

#### インフラストラクチャ（CDK）
```bash
# テスト実行
cd package/infra
uv run pytest

# スナップショット更新
uv run pytest --update-snapshots
```

**テスト対象:**
- CDK スタック構成
- リソース設定
- IAM ポリシー

**使用ツール:**
- pytest
- aws-cdk-lib/assertions

### 2. Integration Tests（結合テスト）

#### API Integration Tests
```bash
# DynamoDB Local を使用した結合テスト
cd package/api
uv run pytest tests/integration/
```

**テスト対象:**
- API とデータベースの連携
- 認証フロー
- エラーハンドリング

### 3. End-to-End Tests（E2Eテスト）

```bash
# E2E テスト実行
cd package/web
npm run test:e2e

# UI モードで実行
npm run test:e2e:ui

# ヘッドレスモードで実行
npm run test:e2e:headed
```

**テスト対象:**
- ユーザーワークフロー
- ページ間遷移
- API 連携

**使用ツール:**
- Playwright

## テストファイル構造

```
package/
├── api/
│   └── tests/
│       ├── unit/           # 単体テスト
│       ├── integration/    # 結合テスト
│       └── conftest.py     # pytest 設定
├── web/
│   └── tests/
│       ├── components/     # コンポーネントテスト
│       ├── e2e/           # E2Eテスト
│       └── utils/         # ユーティリティテスト
└── infra/
    └── tests/
        ├── unit/          # CDK 単体テスト
        └── snapshots/     # スナップショット
```

## テスト作成ガイドライン

### 1. 命名規則

```python
# Python テスト
def test_get_videos_by_year_returns_filtered_results():
    # テスト内容

def test_get_videos_by_year_with_invalid_year_raises_error():
    # テスト内容
```

```typescript
// TypeScript テスト
describe('VideoCard', () => {
  it('should display video title correctly', () => {
    // テスト内容
  });

  it('should handle click events', () => {
    // テスト内容
  });
});
```

### 2. テストデータ

#### Fixtures（Python）
```python
# tests/conftest.py
import pytest
from app.models import Video

@pytest.fixture
def sample_video():
    return Video(
        video_id="test123",
        title="テスト動画",
        tags=["テスト"],
        year=2024,
        thumbnail_url="https://example.com/thumb.jpg"
    )
```

#### Mock Data（TypeScript）
```typescript
// tests/fixtures/mockVideo.ts
export const mockVideo: Video = {
  video_id: "test123",
  title: "テスト動画",
  tags: ["テスト"],
  year: 2024,
  thumbnail_url: "https://example.com/thumb.jpg",
  created_at: "2024-01-01T00:00:00Z"
};
```

### 3. モック・スタブ

#### AWS サービスのモック
```python
# tests/unit/test_dynamodb_service.py
import pytest
from moto import mock_dynamodb
import boto3
from app.services.dynamodb_service import DynamoDBService

@mock_dynamodb
def test_get_videos_by_year():
    # DynamoDB テーブル作成
    dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
    table = dynamodb.create_table(
        TableName="test-table",
        KeySchema=[{"AttributeName": "video_id", "KeyType": "HASH"}],
        AttributeDefinitions=[{"AttributeName": "video_id", "AttributeType": "S"}],
        BillingMode="PAY_PER_REQUEST"
    )

    # テスト実行
    service = DynamoDBService("test-table")
    result = service.get_videos_by_year(2024)

    assert isinstance(result, list)
```

#### API モック（TypeScript）
```typescript
// tests/components/VideoGrid.test.tsx
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/videos', (req, res, ctx) => {
    return res(ctx.json({ items: [mockVideo] }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## パフォーマンステスト

### 1. Load Testing
```bash
# 大量リクエストテスト（手動実行）
# 実際の負荷テストツールの導入を検討
```

### 2. Frontend Performance
```bash
# Lighthouse CI（将来実装予定）
npm run test:lighthouse
```

## テスト実行環境

### 1. ローカル環境

#### 必要なサービス
```bash
# DynamoDB Local（結合テスト用）
docker run -p 8000:8000 amazon/dynamodb-local

# テスト用 API サーバー
cd package/api
uv run python main.py
```

### 2. CI/CD環境

#### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm test

  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
      - run: uv run pytest

  test-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm run test:e2e
```

## カバレッジ目標

- **Unit Tests**: 80%以上
- **Integration Tests**: 主要 API エンドポイント 100%
- **E2E Tests**: 重要ユーザーフロー 100%

## テストデータ管理

### 1. 本番データの使用禁止
- 個人情報を含むデータは使用しない
- テスト専用のダミーデータを作成
- 実際のYouTube動画IDは使用しない

### 2. テストデータクリーンアップ
```python
# 各テスト後のクリーンアップ
@pytest.fixture(autouse=True)
def cleanup_test_data():
    yield
    # テストデータ削除処理
```

## 継続的品質改善

### 1. テストメトリクス監視
- テスト実行時間
- フレーキーテストの特定
- カバレッジ変動

### 2. テストレビュー
- 新機能のテスト要求
- テストケースの妥当性確認
- パフォーマンステストの定期実行

## トラブルシューティング

### よくある問題

#### テストタイムアウト
```bash
# Playwright タイムアウト設定
npm run test:e2e -- --timeout=60000
```

#### モック設定エラー
```python
# pytest でのモック問題
pytest -v --tb=short tests/
```

#### 環境変数未設定
```bash
# テスト用環境変数
export DYNAMODB_TABLE_NAME=test-table
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
```
