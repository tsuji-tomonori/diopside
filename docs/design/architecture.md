# アーキテクチャドキュメント

白雪巴ファンサイト（Diopside）のシステムアーキテクチャ設計書

## 🎯 概要

Diopsideは、白雪巴VTuberの配信アーカイブを管理・閲覧するためのWebアプリケーションです。AWS上でサーバーレス構成を採用し、スケーラブルで費用効率の高いシステムを実現しています。

## 🏗️ システム全体アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│                        Internet                                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                   WAF v2                                        │
│              (Web Application Firewall)                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                 CloudFront                                      │
│            (Content Delivery Network)                          │
└─────────────┬───────────────────────────┬─────────────────────┘
              │                           │
              ▼                           ▼
┌─────────────────────┐         ┌─────────────────────┐
│     S3 Bucket       │         │   API Gateway       │
│   (Static Web)      │         │   (HTTP API)        │
│                     │         └─────────┬───────────┘
│ ┌─────────────────┐ │                   │
│ │   Next.js       │ │                   ▼
│ │   Frontend      │ │         ┌─────────────────────┐
│ │   (Static)      │ │         │      Lambda         │
│ └─────────────────┘ │         │   (FastAPI App)     │
└─────────────────────┘         └─────────┬───────────┘
                                          │
                                          ▼
                                ┌─────────────────────┐
                                │     DynamoDB        │
                                │  (Archive Data)     │
                                └─────────────────────┘
```

## 🔧 技術スタック

### フロントエンド
| 技術 | バージョン | 用途 |
|------|-----------|------|
| **Next.js** | 15.x | React フレームワーク |
| **React** | 19.x | UI ライブラリ |
| **TypeScript** | 5.x | 型安全な開発 |
| **Tailwind CSS** | 3.x | スタイリング |

### バックエンド
| 技術 | バージョン | 用途 |
|------|-----------|------|
| **FastAPI** | 0.115.x | Web API フレームワーク |
| **Python** | 3.13 | プログラミング言語 |
| **Pydantic** | 2.x | データバリデーション |
| **Mangum** | 0.19.x | Lambda アダプター |

### インフラストラクチャ
| サービス | 用途 | 特徴 |
|----------|------|------|
| **AWS Lambda** | サーバーレスコンピュート | 自動スケーリング、従量課金 |
| **Amazon DynamoDB** | NoSQL データベース | 高性能、自動スケーリング |
| **Amazon S3** | オブジェクトストレージ | 静的ファイルホスティング |
| **Amazon CloudFront** | CDN | グローバル配信、キャッシュ |
| **AWS API Gateway** | API 管理 | HTTP API、CORS対応 |
| **AWS WAF** | Web アプリケーションファイアウォール | セキュリティ保護 |

## 📊 データアーキテクチャ

### DynamoDB テーブル設計

#### ArchiveMetadata テーブル

```
パーティションキー: PK (String)
ソートキー: SK (String)

データ構造:
PK: "YEAR#2024"
SK: "VIDEO#dQw4w9WgXcQ"

属性:
- video_id: String (YouTube動画ID)
- title: String (動画タイトル)
- tags: List<String> (階層タグ)
- year: Number (公開年)
- thumbnail_url: String (サムネイルURL)
- created_at: String (作成日時)
- updated_at: String (更新日時)
```

#### Global Secondary Index (GSI)

```
GSI名: ByTag
パーティションキー: Tag (String)
ソートキー: SK (String)

用途: タグベースでの高速検索
```

### データアクセスパターン

1. **年別動画取得**: `PK = "YEAR#2024"` でクエリ
2. **特定動画取得**: `PK = "YEAR#2024", SK = "VIDEO#videoId"` で取得
3. **タグ検索**: GSI `ByTag` を使用してタグベース検索
4. **ランダム動画**: Scan操作でランダムサンプリング

## 🌐 API 設計

### RESTful API エンドポイント

```
GET    /                          # ヘルスチェック
GET    /health                    # サービス状態確認
GET    /api/videos                # 動画一覧取得
GET    /api/videos/{video_id}     # 特定動画取得
GET    /api/videos/by-tag         # タグ別動画取得
GET    /api/videos/random         # ランダム動画取得
GET    /api/videos/memory         # メモリーゲーム用動画取得
GET    /api/tags                  # タグ階層取得
```

### API レスポンス形式

```json
{
  "items": [
    {
      "video_id": "dQw4w9WgXcQ",
      "title": "【ホラーゲーム】Cry of Fear",
      "tags": ["ゲーム実況", "ホラー"],
      "year": 2023,
      "thumbnail_url": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      "created_at": "2023-10-15T14:30:00Z"
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

## 🔐 セキュリティアーキテクチャ

### 多層防御戦略

```
┌─────────────────────────────────────────────────────────────────┐
│                     Layer 1: WAF                               │
│  • SQL Injection 防止                                          │
│  • XSS 攻撃防止                                                │
│  • Rate Limiting                                               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                   Layer 2: CloudFront                          │
│  • DDoS 保護                                                   │
│  • SSL/TLS 終端                                                │
│  • Origin Access Identity                                      │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                   Layer 3: API Gateway                         │
│  • CORS 設定                                                   │
│  • Request/Response 変換                                       │
│  • Throttling                                                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                   Layer 4: Lambda                              │
│  • Input Validation (Pydantic)                                │
│  • Business Logic Security                                     │
│  • IAM Role による最小権限                                      │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                   Layer 5: DynamoDB                            │
│  • 保存時暗号化                                                │
│  • VPC Endpoint (オプション)                                   │
│  • Fine-grained Access Control                                │
└─────────────────────────────────────────────────────────────────┘
```

### IAM ロール設計

#### Lambda 実行ロール
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:Query",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:ap-northeast-1:*:table/ArchiveMetadata-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::shirayuki-tomo-fansite-*/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:ap-northeast-1:*:*"
    }
  ]
}
```

## 📈 スケーラビリティ設計

### 自動スケーリング戦略

#### Lambda 関数
- **同時実行数**: 1000（デフォルト）
- **予約同時実行**: 本番環境で設定
- **プロビジョニング済み同時実行**: 必要に応じて設定

#### DynamoDB
- **オンデマンドキャパシティ**: 自動スケーリング
- **読み取り/書き込み**: トラフィックに応じて自動調整
- **GSI**: 独立したキャパシティ設定

#### CloudFront
- **エッジロケーション**: 世界中に分散
- **キャッシュ戦略**: 静的コンテンツの長期キャッシュ

### パフォーマンス最適化

```python
# Lambda 関数の最適化例
import json
from functools import lru_cache
from typing import Dict, Any

# 接続の再利用
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['DYNAMODB_TABLE_NAME'])

@lru_cache(maxsize=128)
def get_cached_data(cache_key: str) -> Dict[str, Any]:
    """キャッシュ機能付きデータ取得"""
    # 実装
    pass

# コールドスタート対策
def lambda_handler(event, context):
    # 最小限の初期化処理
    pass
```

## 🔍 モニタリング・ログ設計

### CloudWatch メトリクス

#### Lambda メトリクス
- **Duration**: 実行時間
- **Errors**: エラー数
- **Throttles**: スロットリング数
- **Invocations**: 実行回数

#### DynamoDB メトリクス
- **ConsumedReadCapacityUnits**: 読み取り消費量
- **ConsumedWriteCapacityUnits**: 書き込み消費量
- **ThrottledRequests**: スロットリング数

#### CloudFront メトリクス
- **Requests**: リクエスト数
- **BytesDownloaded**: ダウンロード量
- **4xxErrorRate**: 4xx エラー率
- **5xxErrorRate**: 5xx エラー率

### ログ設計

```python
import logging
import json
from datetime import datetime

# 構造化ログの例
logger = logging.getLogger(__name__)

def log_api_request(event: dict, response: dict, duration: float):
    """API リクエストのログ出力"""
    log_data = {
        "timestamp": datetime.utcnow().isoformat(),
        "request_id": event.get("requestContext", {}).get("requestId"),
        "method": event.get("httpMethod"),
        "path": event.get("path"),
        "status_code": response.get("statusCode"),
        "duration_ms": duration * 1000,
        "user_agent": event.get("headers", {}).get("User-Agent"),
        "ip_address": event.get("requestContext", {}).get("identity", {}).get("sourceIp")
    }
    logger.info(json.dumps(log_data))
```

## 🚀 デプロイメントアーキテクチャ

### Infrastructure as Code (IaC)

```python
# AWS CDK による Infrastructure as Code
from aws_cdk import (
    Stack,
    aws_lambda as lambda_,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_cloudfront as cloudfront,
    aws_apigatewayv2 as apigwv2,
)

class BaseStack(Stack):
    def __init__(self, scope, construct_id, environment, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # DynamoDB テーブル
        self.dynamodb_table = self._create_dynamodb_table()

        # Lambda 関数
        self.lambda_function = self._create_lambda_function()

        # API Gateway
        self.api_gateway = self._create_api_gateway()

        # S3 バケット
        self.s3_bucket = self._create_s3_bucket()

        # CloudFront ディストリビューション
        self.cloudfront_distribution = self._create_cloudfront_distribution()
```

### CI/CD パイプライン

```yaml
# GitHub Actions ワークフロー
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Tests
        run: |
          # フロントエンドテスト
          cd frontend && npm test
          # バックエンドテスト
          cd backend && uv run pytest
          # インフラテスト
          cd infrastructure && uv run pytest

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy Infrastructure
        run: |
          cd infrastructure
          uv run cdk deploy --require-approval never
```

## 🔄 災害復旧・バックアップ戦略

### データバックアップ

#### DynamoDB
- **Point-in-Time Recovery**: 35日間の自動バックアップ
- **On-Demand Backup**: 手動バックアップ作成
- **Cross-Region Replication**: 必要に応じて設定

#### S3
- **Versioning**: オブジェクトバージョニング有効
- **Cross-Region Replication**: 災害復旧用
- **Lifecycle Policy**: 古いバージョンの自動削除

### 災害復旧手順

1. **RTO (Recovery Time Objective)**: 4時間
2. **RPO (Recovery Point Objective)**: 1時間
3. **復旧手順**:
   - CloudFormation スタックの再作成
   - DynamoDB データの復元
   - S3 オブジェクトの復元
   - DNS 設定の更新

## 📊 コスト最適化

### 料金モデル

#### 従量課金サービス
- **Lambda**: 実行時間・メモリ使用量
- **DynamoDB**: 読み書き要求数
- **S3**: ストレージ使用量・リクエスト数
- **CloudFront**: データ転送量

#### 固定費用サービス
- **Route 53**: ホストゾーン料金
- **WAF**: WebACL 料金

### コスト削減戦略

1. **Lambda 最適化**
   - メモリサイズの適切な設定
   - 実行時間の最小化
   - 不要な依存関係の削除

2. **DynamoDB 最適化**
   - オンデマンドキャパシティの活用
   - 不要なデータの定期削除
   - GSI の適切な設計

3. **S3 最適化**
   - ライフサイクルポリシーの設定
   - 不要なバージョンの削除
   - 適切なストレージクラスの選択

## 🔮 将来の拡張計画

### 短期計画（3-6ヶ月）
- **認証機能**: AWS Cognito による認証
- **管理画面**: 動画メタデータの管理機能
- **通知機能**: 新着動画の通知

### 中期計画（6-12ヶ月）
- **検索機能強化**: Elasticsearch による全文検索
- **レコメンデーション**: 機械学習による推薦機能
- **モバイルアプリ**: React Native による専用アプリ

### 長期計画（1年以上）
- **マルチテナント**: 複数VTuber対応
- **リアルタイム機能**: WebSocket による即座更新
- **AI機能**: 動画内容の自動タグ付け

---

## 📞 アーキテクチャに関する質問・提案

アーキテクチャに関する質問や改善提案は、以下で受け付けています：

- **GitHub Issues**: 技術的な質問・提案
- **GitHub Discussions**: アーキテクチャ設計の議論
- **Architecture Decision Records (ADR)**: 重要な設計決定の記録

このドキュメントは、システムの成長とともに継続的に更新されます。
