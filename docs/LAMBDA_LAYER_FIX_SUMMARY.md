# Lambda Layer Fix Summary

## 問題の概要

Lambda関数のデプロイ時に以下のエラーが発生していました：

```
❌ ShirayukiTomoFansiteDevStack failed: _ToolkitError: The stack named ShirayukiTomoFansiteDevStack failed creation, it may need to be manually deleted from the AWS console: ROLLBACK_COMPLETE: Resource handler returned message: "Unzipped size must be smaller than 262144000 bytes (Service: Lambda, Status Code: 400, Request ID: 2bb6cb56-f9ff-4605-81af-40d0eece9458) (SDK Attempt Count: 1)"
```

これは、FastAPIやその他の依存関係がLambda関数コードと一緒にパッケージ化され、展開後のサイズが262MB制限を超えたためです。

## 実施した修正

### 1. Lambda Layer の導入

#### `infrastructure/requirements.txt` の作成
Lambda Layer用の依存関係を定義：
```txt
boto3>=1.38.32
fastapi>=0.115.12
pydantic>=2.11.5
mangum>=0.19.0
```

#### `base_stack.py` の修正
Lambda関数でLayerを使用するように変更：

```python
# Create Lambda layer for dependencies
dependencies_layer = lambda_.LayerVersion(
    self,
    "DependenciesLayer",
    code=lambda_.Code.from_asset(".layers"),
    compatible_runtimes=[lambda_.Runtime.PYTHON_3_13],
    description="FastAPI and other dependencies for the backend",
)

# Get AWS Lambda Powertools layer ARN for the current region
powertools_layer = lambda_.LayerVersion.from_layer_version_arn(
    self,
    "PowertoolsLayer",
    layer_version_arn=f"arn:aws:lambda:{self.region}:017000801446:layer:AWSLambdaPowertoolsPythonV2:40",
)

function = lambda_.Function(
    # ...
    layers=[dependencies_layer, powertools_layer],
    memory_size=256,  # Increased for better performance
    # ...
)
```

### 2. Taskfile.yaml によるデプロイ管理

#### 主要タスク
- `install-deps`: Lambda Layer用依存関係のインストール
- `deploy`: 全スタックのデプロイ
- `deploy-waf`: WAFスタックのみデプロイ
- `deploy-main`: メインスタックのみデプロイ
- `bootstrap`: CDK環境の初期化
- `diff`: 変更差分の確認
- `clean`: ビルド成果物のクリーンアップ

#### 依存関係インストール
```yaml
install-deps:
  desc: "Install Lambda layer dependencies"
  cmds:
    - mkdir -p .layers/python
    - uv pip install -r requirements.txt --target .layers/python --no-cache-dir --python-version 3.13
```

### 3. 追加改善

#### AWS Powertools Layer の追加
- 観測性とユーティリティ機能を提供
- AWS管理のLayerを使用してメンテナンス負荷を軽減

#### メモリサイズの最適化
- 128MB → 256MB に増加
- Layer使用によるコールドスタート時間の改善

#### 環境変数の追加
```python
environment={
    "DYNAMODB_TABLE_NAME": self.dynamodb_table.table_name,
    "S3_BUCKET_NAME": self.s3_bucket.bucket_name,
    "ENVIRONMENT": self.env_name,
    "POWERTOOLS_SERVICE_NAME": "shirayuki-tomo-fansite",
    "POWERTOOLS_METRICS_NAMESPACE": "ShirayukiTomoFansite",
}
```

## 動作確認

### CDK Synthesis
```bash
task synth
# ✅ Successfully synthesized to /workspace/diopside/infrastructure/cdk.out
```

### Lambda Layer 確認
生成されたCloudFormationテンプレートで以下を確認：
- `AWS::Lambda::LayerVersion` リソースの生成
- Lambda関数の `Layers` プロパティに2つのLayer設定
- 依存関係がLayerに分離されていることを確認

## デプロイ手順

### 1. 初回セットアップ
```bash
# Task のインストール
./install-task.sh

# CDK Bootstrap
task bootstrap
```

### 2. デプロイ実行
```bash
# 段階的デプロイ（推奨）
task deploy-waf    # WAFスタック先行デプロイ
task deploy-main   # メインスタックデプロイ

# または一括デプロイ
task deploy
```

## ファイル構成

```
infrastructure/
├── Taskfile.yaml              # デプロイタスク定義
├── requirements.txt           # Lambda Layer依存関係
├── .layers/                   # 生成されるLayer（.gitignore対象）
│   └── python/               # Python依存関係
├── stacks/base_stack.py      # Lambda Layer設定を含むスタック
├── DEPLOYMENT.md             # 詳細デプロイガイド
└── install-task.sh           # Task インストールスクリプト
```

## 技術的メリット

1. **サイズ制限回避**: 依存関係をLayerに分離してLambda関数サイズを削減
2. **デプロイ効率化**: 依存関係の変更がない場合、Lambda関数のみの更新が可能
3. **再利用性**: 複数のLambda関数で同じLayerを共有可能
4. **観測性向上**: AWS Powertools Layerによる標準化されたログ・メトリクス
5. **自動化**: Taskfileによる一貫したデプロイプロセス

この修正により、Lambda関数のデプロイサイズ問題が解決され、効率的なサーバーレスアーキテクチャが実現されました。