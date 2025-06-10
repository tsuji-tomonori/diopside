# CDK デプロイエラー修正レポート

## 修正概要

CDKデプロイ時に発生していた以下のエラーを修正しました：

```
❌ ShirayukiTomoFansiteDevStack failed: _ToolkitError: The stack named ShirayukiTomoFansiteDevStack failed creation, it may need to be manually deleted from the AWS console: ROLLBACK_COMPLETE: Resource handler returned message: "Error reason: The scope is not valid., field: SCOPE_VALUE, parameter: CLOUDFRONT (Service: Wafv2, Status Code: 400, Request ID: d087ce80-b8c4-48e5-805c-c68f1a93548b) (SDK Attempt Count: 1)"
```

## 実施した修正

### 1. WAF WebACL のリージョン分離

**問題**: CloudFront用のWAF WebACLが`ap-northeast-1`で作成されようとしていた

**修正内容**:
- WAF専用スタック (`WafStack`) を新規作成
- WAFスタックを`us-east-1`リージョンに固定
- クロススタック参照でWebACL ARNを他スタックに渡す仕組みを実装

**変更ファイル**:
- `infrastructure/stacks/waf_stack.py` (新規作成)
- `infrastructure/app.py` (WAFスタック追加、依存関係設定)

### 2. 非推奨API の置き換え

**問題**: `aws_cloudfront_origins.S3Origin` が非推奨

**修正内容**:
- `S3Origin` → `S3BucketOrigin` に置き換え
- Origin Access Identity (OAI) → Origin Access Control (OAC) に更新
- 最新のCloudFront セキュリティベストプラクティスに準拠

**変更ファイル**:
- `infrastructure/stacks/base_stack.py` (CloudFront設定更新)

### 3. スタック構成の最適化

**修正内容**:
- BaseStack, DevStack, ProdStackにWebACL ARNパラメータを追加
- WAF関連コードをBaseStackから削除
- スタック間依存関係を明確化

## 新しいスタック構成

```
us-east-1 リージョン:
├── ShirayukiTomoFansiteDevWafStack
└── ShirayukiTomoFansiteProdWafStack

ap-northeast-1 リージョン:
├── ShirayukiTomoFansiteDevStack (depends on DevWafStack)
└── ShirayukiTomoFansiteProdStack (depends on ProdWafStack)
```

## デプロイ手順

### 1. CDK Bootstrap (初回のみ)

```bash
# us-east-1 (WAF用)
cdk bootstrap aws://<ACCOUNT_ID>/us-east-1

# ap-northeast-1 (メインリソース用)
cdk bootstrap aws://<ACCOUNT_ID>/ap-northeast-1
```

### 2. 開発環境デプロイ

```bash
# WAFスタック (us-east-1)
cdk deploy ShirayukiTomoFansiteDevWafStack

# メインスタック (ap-northeast-1)
cdk deploy ShirayukiTomoFansiteDevStack
```

### 3. 本番環境デプロイ

```bash
# WAFスタック (us-east-1)
cdk deploy ShirayukiTomoFansiteProdWafStack

# メインスタック (ap-northeast-1)
cdk deploy ShirayukiTomoFansiteProdStack
```

## セキュリティ向上点

1. **Origin Access Control (OAC)**: 従来のOAIより安全なアクセス制御
2. **WAF ルール強化**: 
   - AWSManagedRulesCommonRuleSet
   - AWSManagedRulesKnownBadInputsRuleSet
3. **適切なリージョン分離**: CloudFrontとWAFの要件に準拠

## 注意事項

- **既存スタックの削除**: 修正前のスタックが残っている場合は手動削除が必要
- **デプロイ順序**: WAFスタックを先にデプロイする必要がある
- **リージョン設定**: WAFは必ずus-east-1、メインリソースはap-northeast-1

## 追加ドキュメント

詳細なデプロイ手順は `infrastructure/DEPLOYMENT.md` を参照してください。

## 検証結果

- ✅ CDK合成 (`cdk synth`) が正常に完了
- ✅ 非推奨APIの警告が解消
- ✅ WAFスタックがus-east-1で正しく定義
- ✅ クロススタック参照が正常に動作