# Cross-Region References Fix Summary

## 問題の概要

CDKのクロスリージョン参照機能が有効化されていなかったため、WAFスタック（us-east-1）からメインスタック（ap-northeast-1）へのWebACL ARN参照が失敗していました。

## 実施した修正

### 1. `app.py` の修正

両スタックに `cross_region_references=True` を追加し、WebACL ARNを直接渡すように変更：

```python
# WAFスタック
dev_waf_stack = WafStack(
    app,
    "ShirayukiTomoFansiteDevWafStack",
    environment="dev",
    env=cdk.Environment(
        account=app.node.try_get_context("account"),
        region="us-east-1",
    ),
    cross_region_references=True,  # 追加
    tags={...},
)

# メインスタック
dev_stack = DevStack(
    app,
    "ShirayukiTomoFansiteDevStack",
    web_acl_arn=dev_waf_stack.web_acl.attr_arn,  # 直接ARNを渡す
    env=cdk.Environment(
        account=app.node.try_get_context("account"),
        region="ap-northeast-1",
    ),
    cross_region_references=True,  # 追加
    tags={...},
)
```

### 2. `base_stack.py` の修正

WebACL ARNの取得ロジックを改善：

```python
# Get WebACL ARN - use provided ARN directly for cross-region references
if web_acl_arn is None:
    # Fallback to SSM Parameter lookup for backward compatibility
    self.web_acl_arn = ssm.StringParameter.value_for_string_parameter(
        self,
        parameter_name=f"/shirayuki-tomo-fansite/{self.env_name}/waf/webacl-arn",
    )
else:
    # Use provided WebACL ARN directly (recommended for cross-region references)
    self.web_acl_arn = web_acl_arn
```

### 3. `waf_stack.py` の修正

コンストラクタのドキュメントを更新して `cross_region_references` パラメータに対応：

```python
def __init__(
    self,
    scope: Construct,
    construct_id: str,
    environment: str,
    **kwargs: Any,
) -> None:
    """Initialize the WAF stack.

    Args:
        scope: The scope in which to define this construct
        construct_id: The scoped construct ID
        environment: Environment name (dev/prod)
        **kwargs: Additional keyword arguments (including cross_region_references)
    """
    super().__init__(scope, construct_id, **kwargs)
```

## 動作確認

CDK synthesis が成功し、以下が確認できました：

1. **WAFスタック**: SSM Parameter と CrossRegionExportWriter カスタムリソースが生成
2. **メインスタック**: ExportsReader カスタムリソースと `{{resolve:ssm:...}}` 動的参照が生成
3. **CloudFront**: WebACLId が適切にクロスリージョン参照で設定

## 次のステップ

1. Bootstrap スタックを最新版（v21以上）に更新：
   ```bash
   cdk bootstrap aws://167545301745/us-east-1 \
                 aws://167545301745/ap-northeast-1
   ```

2. WAFスタックを先にデプロイ：
   ```bash
   uv run cdk deploy ShirayukiTomoFansiteDevWafStack
   ```

3. SSM パラメータの存在確認：
   ```bash
   aws ssm get-parameter \
     --name /shirayuki-tomo-fansite/dev/waf/webacl-arn \
     --region ap-northeast-1
   ```

4. メインスタックをデプロイ：
   ```bash
   uv run cdk deploy ShirayukiTomoFansiteDevStack
   ```

## 技術的詳細

- CDKの `cross_region_references=True` により、自動的にSSMパラメータとカスタムリソースが生成される
- 参照側では `{{resolve:ssm:...}}` 動的参照を使用してCloudFormationが実行時に値を取得
- 従来の手動SSM参照（`ssm.StringParameter.value_for_string_parameter`）はフォールバックとして残存