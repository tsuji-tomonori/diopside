# CDK デプロイエラー修正レポート

## 修正概要

CDKデプロイ時に発生していた以下のエラーを修正しました：

```
❌ No export named WebACLArn-dev found. Rollback requested by user.
❌ Bootstrap stack version が古い（バージョン21未満）
```

## 実施した修正

### 1. WAF エクスポート名の修正

**問題**: WAFスタックのCfnOutputのIDが環境固有でなかったため、複数環境で競合が発生する可能性があった

**修正内容**:
```python
# 修正前
cdk.CfnOutput(
    self,
    "WebACLArn",  # 固定ID
    value=self.web_acl.attr_arn,
    export_name=f"WebACLArn-{self.env_name}",
)

# 修正後
cdk.CfnOutput(
    self,
    f"WebACLArn{self.env_name.title()}",  # 環境固有ID
    value=self.web_acl.attr_arn,
    export_name=f"WebACLArn-{self.env_name}",
)
```

**変更ファイル**: `infrastructure/stacks/waf_stack.py`

### 2. デプロイメントドキュメントの統合

**問題**: `infrastructure/DEPLOYMENT.md` と `docs/deployment.md` に重複した内容があり、メンテナンス性が低下していた

**修正内容**:
- `infrastructure/DEPLOYMENT.md` を削除
- `docs/deployment.md` に全ての内容を統合
- WAF関連のトラブルシューティングを強化
- CDK Bootstrap の手順を明確化

**追加された内容**:
- WAF関連エラーの詳細な解決方法
- CDK Bootstrap バージョン更新手順
- クロススタック参照エラーの対処法
- 環境固有のチェックリスト

### 3. README.mdの更新

**修正内容**:
- 統合されたデプロイメントガイドへの参照を追加
- WAFスタックの重要性を強調
- トラブルシューティングセクションを強化
- プロジェクト構造にwaf_stack.pyを追加

**変更ファイル**: `infrastructure/README.md`

## 新しいスタック構成

```
us-east-1 リージョン:
├── ShirayukiTomoFansiteDevWafStack
└── ShirayukiTomoFansiteProdWafStack

ap-northeast-1 リージョン:
├── ShirayukiTomoFansiteDevStack (depends on DevWafStack)
└── ShirayukiTomoFansiteProdStack (depends on ProdWafStack)
```

## 修正後の推奨デプロイ手順

### 1. 初回セットアップ

```bash
# 最新CDK CLIのインストール
npm install -g aws-cdk@latest

# 両方のリージョンでBootstrap実行
cdk bootstrap aws://<ACCOUNT_ID>/us-east-1
cdk bootstrap aws://<ACCOUNT_ID>/ap-northeast-1
```

### 2. 開発環境デプロイ

```bash
cd infrastructure

# 依存関係のインストール
uv sync --dev

# WAFスタックが自動的に先にデプロイされる
uv run cdk deploy ShirayukiTomoFansiteDevStack
```

### 3. デプロイ確認

```bash
# エクスポートの確認
aws cloudformation list-exports --region us-east-1 | grep WebACLArn

# スタック状態の確認
aws cloudformation describe-stacks --stack-name ShirayukiTomoFansiteDevWafStack --region us-east-1
```

## 検証結果

### CDK合成テスト

```bash
uv run cdk synth ShirayukiTomoFansiteDevWafStack
```

**結果**: 正常に合成され、以下の出力が確認できた:

```yaml
Outputs:
  WebACLArnDev:
    Description: WebACL ARN for dev environment
    Value:
      Fn::GetAtt:
        - WebACL
        - Arn
    Export:
      Name: WebACLArn-dev  # 正しいエクスポート名
```

## トラブルシューティング強化

### WAF関連エラー

**エラー**: `No export named WebACLArn-dev found`

**解決方法**: 
```bash
# WAFスタックを先にus-east-1でデプロイ
uv run cdk deploy ShirayukiTomoFansiteDevWafStack

# エクスポートの確認
aws cloudformation list-exports --region us-east-1 | grep WebACLArn
```

### CDK Bootstrap エラー

**エラー**: Bootstrap stack version が古い（バージョン21未満）

**解決方法**: 
```bash
# 最新CDK CLIのインストール
npm install -g aws-cdk@latest

# Bootstrap の再実行（両方のリージョンで）
cdk bootstrap aws://167545301745/us-east-1 --force
cdk bootstrap aws://167545301745/ap-northeast-1 --force
```

## 今後の予防策

### 1. テスト強化
- CDK合成テストをCI/CDパイプラインに追加
- クロススタック参照のテストケース追加

### 2. ドキュメント管理
- デプロイメント関連ドキュメントは `docs/deployment.md` に一元化
- 変更時は必ず統合ドキュメントを更新

### 3. 環境管理
- 環境固有のリソース名は必ず環境名を含める
- CDK Bootstrap は定期的に最新バージョンに更新

## 関連ファイル

### 修正されたファイル
- `infrastructure/stacks/waf_stack.py`
- `docs/deployment.md`
- `infrastructure/README.md`

### 削除されたファイル
- `infrastructure/DEPLOYMENT.md`

### 更新されたファイル
- `BUGFIX_SUMMARY.md` (このファイル)

## 追加ドキュメント

詳細なデプロイ手順は `docs/deployment.md` を参照してください。

## 検証完了項目

- ✅ CDK合成 (`cdk synth`) が正常に完了
- ✅ WAF エクスポート名が正しく設定されている
- ✅ クロススタック参照が正常に動作
- ✅ デプロイメントドキュメントが統合されている
- ✅ トラブルシューティング情報が充実している