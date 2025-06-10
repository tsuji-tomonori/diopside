# デプロイ手順

## 概要

このドキュメントでは、白雪巴ファンサイトのインフラストラクチャをAWSにデプロイする手順を説明します。

## 前提条件

1. AWS CLI がインストールされ、適切な認証情報が設定されていること
2. Node.js (v18以上) がインストールされていること
3. AWS CDK CLI がインストールされていること (`npm install -g aws-cdk`)
4. Python 3.13 がインストールされていること

## 初回セットアップ

### 1. CDK Bootstrap の実行

CDK を使用するために、各リージョンでBootstrapを実行する必要があります。

```bash
# us-east-1 (WAF用)
cdk bootstrap aws://<ACCOUNT_ID>/us-east-1

# ap-northeast-1 (メインリソース用)
cdk bootstrap aws://<ACCOUNT_ID>/ap-northeast-1
```

`<ACCOUNT_ID>` は実際のAWSアカウントIDに置き換えてください。

### 2. 依存関係のインストール

```bash
cd infrastructure
pip install -r requirements.txt  # または uv sync
```

## デプロイ手順

### 開発環境のデプロイ

1. **WAFスタックのデプロイ（us-east-1）**
   ```bash
   cdk deploy ShirayukiTomoFansiteDevWafStack
   ```

2. **メインスタックのデプロイ（ap-northeast-1）**
   ```bash
   cdk deploy ShirayukiTomoFansiteDevStack
   ```

### 本番環境のデプロイ

1. **WAFスタックのデプロイ（us-east-1）**
   ```bash
   cdk deploy ShirayukiTomoFansiteProdWafStack
   ```

2. **メインスタックのデプロイ（ap-northeast-1）**
   ```bash
   cdk deploy ShirayukiTomoFansiteProdStack
   ```

## 一括デプロイ

全てのスタックを一度にデプロイする場合：

```bash
# 開発環境
cdk deploy ShirayukiTomoFansiteDevWafStack ShirayukiTomoFansiteDevStack

# 本番環境
cdk deploy ShirayukiTomoFansiteProdWafStack ShirayukiTomoFansiteProdStack
```

## 重要な注意事項

### WAF スタックについて

- **CloudFront用のWAF WebACLは必ずus-east-1リージョンで作成する必要があります**
- WAFスタックは他のスタックより先にデプロイする必要があります
- WAFスタックが削除されると、CloudFrontディストリビューションのデプロイが失敗する可能性があります

### リージョン設定

- WAFスタック: `us-east-1`
- メインスタック: `ap-northeast-1`

### スタック依存関係

```
ShirayukiTomoFansiteDevWafStack (us-east-1)
    ↓
ShirayukiTomoFansiteDevStack (ap-northeast-1)

ShirayukiTomoFansiteProdWafStack (us-east-1)
    ↓
ShirayukiTomoFansiteProdStack (ap-northeast-1)
```

## トラブルシューティング

### WAF関連のエラー

**エラー**: `The scope is not valid., field: SCOPE_VALUE, parameter: CLOUDFRONT`

**原因**: WAF WebACLがus-east-1以外のリージョンで作成されようとしている

**解決方法**: WAFスタックが正しくus-east-1で作成されていることを確認

### Bootstrap関連のエラー

**エラー**: Bootstrap stack version が古い

**解決方法**: 
```bash
cdk bootstrap aws://<ACCOUNT_ID>/us-east-1 --force
cdk bootstrap aws://<ACCOUNT_ID>/ap-northeast-1 --force
```

### クロススタック参照エラー

**エラー**: `WebACLArn-dev` が見つからない

**原因**: WAFスタックがデプロイされていない、または異なるリージョンにデプロイされている

**解決方法**: WAFスタックを先にus-east-1でデプロイする

## 削除手順

スタックを削除する場合は、依存関係の逆順で削除してください：

```bash
# 開発環境
cdk destroy ShirayukiTomoFansiteDevStack
cdk destroy ShirayukiTomoFansiteDevWafStack

# 本番環境
cdk destroy ShirayukiTomoFansiteProdStack
cdk destroy ShirayukiTomoFansiteProdWafStack
```

## 設定の確認

デプロイ前に設定を確認する場合：

```bash
# 合成（テンプレート生成）のみ実行
cdk synth

# 差分確認
cdk diff ShirayukiTomoFansiteDevWafStack
cdk diff ShirayukiTomoFansiteDevStack
```