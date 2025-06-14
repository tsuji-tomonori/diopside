# Refactor Summary: Centralized Task Management and Dependency Consolidation

## 実施した変更

### 1. Taskfile.yaml の移動
- **移動前**: `infrastructure/Taskfile.yaml`
- **移動後**: `Taskfile.yaml` (root)
- **理由**: プロジェクト全体のタスク管理を一元化

### 2. 依存関係管理の統合
- **削除**: `infrastructure/requirements.txt`
- **統合先**: `backend/pyproject.toml` を単一の情報源として使用
- **自動化**: `uv export` でバックエンドの依存関係を自動抽出

### 3. Lambda Layer 構築の改善
```yaml
install-deps:
  desc: "Install Lambda layer dependencies from backend"
  dir: infrastructure
  cmds:
    - mkdir -p .layers/python
    - cd ../backend && uv export --no-hashes --no-dev | grep -v "^-e" > ../infrastructure/.layers/requirements.txt
    - uv pip install -r .layers/requirements.txt --target .layers/python --no-cache-dir --python-version 3.13
```

### 4. .gitignore の更新
```gitignore
# Lambda layers (temporary build artifacts)
infrastructure/.layers/
.layers/
```

### 5. バックエンド開発タスクの追加
```yaml
backend:dev:     # 開発サーバー起動
backend:test:    # テスト実行
backend:lint:    # リンター実行
```

## 技術的メリット

### ✅ 依存関係管理の一元化
- `backend/pyproject.toml` が唯一の情報源
- 重複した依存関係定義の排除
- バックエンドとLambda Layerの依存関係同期保証

### ✅ プロジェクト構造の簡素化
```
diopside/
├── Taskfile.yaml          # 全タスクを一元管理
├── install-task.sh        # Task インストール
├── backend/
│   └── pyproject.toml     # 依存関係の単一情報源
└── infrastructure/
    └── .layers/           # 自動生成（gitignore対象）
```

### ✅ 開発体験の向上
- rootディレクトリから全てのタスクを実行可能
- 一貫したコマンド体系
- 自動化された依存関係管理

### ✅ CI/CD の簡素化
- 単一のTaskfileで全ての操作を管理
- 依存関係の自動同期
- ビルド成果物の適切な除外

## 使用方法

### 初回セットアップ
```bash
git clone https://github.com/tsuji-tomonori/diopside.git
cd diopside
./install-task.sh
```

### 開発ワークフロー
```bash
# 依存関係インストール
cd backend && uv sync && cd ..
cd frontend && npm install && cd ..
cd infrastructure && uv sync && cd ..

# 開発サーバー起動
task backend:dev        # バックエンド
cd frontend && npm run dev  # フロントエンド
```

### デプロイワークフロー
```bash
task bootstrap          # 初回のみ
task deploy-waf         # WAF先行デプロイ
task deploy-main        # メインデプロイ
# または
task deploy             # 一括デプロイ
```

## 動作確認

### Lambda Layer 生成
```bash
task install-deps
# ✅ infrastructure/.layers/requirements.txt 自動生成
# ✅ infrastructure/.layers/python/ に依存関係インストール
```

### CDK Synthesis
```bash
task synth
# ✅ Successfully synthesized to infrastructure/cdk.out
```

### 依存関係の同期確認
```bash
# バックエンドの依存関係
cd backend && uv export --no-hashes --no-dev

# Lambda Layerの依存関係（自動生成）
cat infrastructure/.layers/requirements.txt
```

## ファイル変更サマリー

### 移動・削除
- ✅ `infrastructure/Taskfile.yaml` → `Taskfile.yaml`
- ✅ `infrastructure/install-task.sh` → `install-task.sh`
- ❌ `infrastructure/requirements.txt` (削除)

### 更新
- ✅ `.gitignore`: Lambda layer ディレクトリを除外
- ✅ `README.md`: 新しいTaskfile構造を反映
- ✅ `infrastructure/DEPLOYMENT.md`: 更新されたワークフローを記載

### 新機能
- ✅ `uv export` による自動依存関係抽出
- ✅ バックエンド開発タスクの統合
- ✅ 一元化されたタスク管理

この refactor により、プロジェクトの保守性と開発体験が大幅に向上し、依存関係管理の複雑さが解消されました。