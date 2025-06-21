# Monitoring and Observability Guide

## 監視・可観測性ガイド

Diopsideシステムの監視、ログ、メトリクス、アラートの運用ガイドです。

## 監視アーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CloudWatch    │    │   X-Ray         │    │   AWS Config    │
│   Metrics       │    │   Tracing       │    │   Compliance    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Observability Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (S3/CloudFront) │ API (Lambda/API Gateway) │ Data (DynamoDB) │
└─────────────────────────────────────────────────────────────────┘
```

## CloudWatch メトリクス

### 1. Lambda 関数メトリクス

#### 主要メトリクス
```bash
# Lambda 関数の実行時間
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=ShirayukiTomoFansite-FastAPIFunction \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 300 \
  --statistics Average,Maximum

# エラー率の確認
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=ShirayukiTomoFansite-FastAPIFunction \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 300 \
  --statistics Sum
```

#### カスタムメトリクス
```python
# Lambda 関数内でのカスタムメトリクス送信
import boto3
from datetime import datetime

cloudwatch = boto3.client('cloudwatch')

def put_custom_metric(metric_name: str, value: float, unit: str = 'Count'):
    """カスタムメトリクスをCloudWatchに送信"""
    cloudwatch.put_metric_data(
        Namespace='Diopside/Application',
        MetricData=[
            {
                'MetricName': metric_name,
                'Value': value,
                'Unit': unit,
                'Timestamp': datetime.utcnow()
            }
        ]
    )

# 使用例
put_custom_metric('VideoRequests', 1)
put_custom_metric('ResponseTime', response_time_ms, 'Milliseconds')
```

### 2. DynamoDB メトリクス

#### 読み取り/書き込み容量
```bash
# 消費された読み取り容量ユニット
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=ArchiveMetadata \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 300 \
  --statistics Sum

# スロットリングイベント
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ThrottledRequests \
  --dimensions Name=TableName,Value=ArchiveMetadata \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 300 \
  --statistics Sum
```

### 3. CloudFront メトリクス

```bash
# リクエスト数
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name Requests \
  --dimensions Name=DistributionId,Value=E1234567890ABC \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 300 \
  --statistics Sum

# 4xx エラー率
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name 4xxErrorRate \
  --dimensions Name=DistributionId,Value=E1234567890ABC \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 300 \
  --statistics Average
```

## ログ管理

### 1. 構造化ログ

#### Lambda 関数ログ
```python
# app/main.py
import json
import logging
from datetime import datetime
from aws_lambda_powertools import Logger

# PowerTools Logger の使用
logger = Logger(service="diopside")

@logger.inject_lambda_context(log_event=True)
def lambda_handler(event, context):
    """Lambda ハンドラー関数"""

    # 構造化ログの出力
    logger.info("API request received", extra={
        "request_id": context.aws_request_id,
        "path": event.get("path"),
        "method": event.get("httpMethod"),
        "user_agent": event.get("headers", {}).get("User-Agent"),
        "source_ip": event.get("requestContext", {}).get("identity", {}).get("sourceIp")
    })

    try:
        response = process_request(event)

        logger.info("API request completed", extra={
            "request_id": context.aws_request_id,
            "status_code": response.get("statusCode"),
            "response_size": len(response.get("body", ""))
        })

        return response

    except Exception as e:
        logger.error("API request failed", extra={
            "request_id": context.aws_request_id,
            "error": str(e),
            "error_type": type(e).__name__
        })
        raise
```

### 2. ログクエリ

#### CloudWatch Logs Insights
```sql
-- API エラーの検索
fields @timestamp, @message, request_id, error
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100

-- 特定期間のレスポンス時間分析
fields @timestamp, @duration
| filter @type = "REPORT"
| stats avg(@duration), max(@duration), min(@duration) by bin(5m)

-- 特定のエラータイプを検索
fields @timestamp, @message, error_type
| filter error_type = "ValidationError"
| sort @timestamp desc
```

### 3. ログ保持ポリシー

```python
# CDK でのログ保持設定
from aws_cdk import aws_logs as logs

lambda_function = aws_lambda.Function(
    # ... 他の設定
    log_retention=logs.RetentionDays.ONE_MONTH,  # 1ヶ月保持
)
```

## アラート設定

### 1. CloudWatch Alarms

#### Lambda 関数アラート
```python
# CDK でのアラーム設定
from aws_cdk import aws_cloudwatch as cloudwatch

# エラー率アラーム
error_alarm = cloudwatch.Alarm(
    self, "LambdaErrorAlarm",
    metric=lambda_function.metric_errors(
        period=Duration.minutes(5),
        statistic="Sum"
    ),
    threshold=5,
    evaluation_periods=2,
    comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    alarm_description="Lambda function error rate is too high",
    treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
)

# レスポンス時間アラーム
duration_alarm = cloudwatch.Alarm(
    self, "LambdaDurationAlarm",
    metric=lambda_function.metric_duration(
        period=Duration.minutes(5),
        statistic="Average"
    ),
    threshold=3000,  # 3秒
    evaluation_periods=3,
    comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    alarm_description="Lambda function duration is too high"
)
```

#### DynamoDB アラート
```python
# DynamoDB スロットリングアラーム
throttling_alarm = cloudwatch.Alarm(
    self, "DynamoDBThrottlingAlarm",
    metric=table.metric_throttled_requests(
        period=Duration.minutes(5),
        statistic="Sum"
    ),
    threshold=0,
    evaluation_periods=1,
    comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    alarm_description="DynamoDB throttling detected"
)
```

### 2. SNS 通知設定

```python
# アラート通知用 SNS トピック
alarm_topic = sns.Topic(
    self, "AlarmTopic",
    display_name="Diopside Alerts"
)

# メール通知の設定
alarm_topic.add_subscription(
    sns_subscriptions.EmailSubscription("admin@example.com")
)

# アラームにSNSトピックを関連付け
error_alarm.add_alarm_action(
    cloudwatch_actions.SnsAction(alarm_topic)
)
```

## パフォーマンス監視

### 1. APM（Application Performance Monitoring）

#### AWS X-Ray トレーシング
```python
# X-Ray トレーシングの有効化
from aws_xray_sdk.core import xray_recorder

@xray_recorder.capture("get_videos_by_year")
def get_videos_by_year(year: int):
    """動画データ取得関数"""
    with xray_recorder.in_subsegment("dynamodb_query"):
        # DynamoDB クエリ
        response = table.query(...)

    with xray_recorder.in_subsegment("data_processing"):
        # データ処理
        processed_data = process_videos(response)

    return processed_data
```

### 2. フロントエンドパフォーマンス

#### Real User Monitoring (RUM)
```typescript
// package/web/src/lib/analytics.ts
export const trackPagePerformance = () => {
  if (typeof window !== 'undefined') {
    // Core Web Vitals の測定
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navigationEntry = entry as PerformanceNavigationTiming;
          console.log('Page Load Time:', navigationEntry.loadEventEnd - navigationEntry.fetchStart);
        }
      });
    });

    observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
  }
};
```

## 監視ダッシュボード

### 1. CloudWatch Dashboard

```python
# CDK でのダッシュボード作成
dashboard = cloudwatch.Dashboard(
    self, "DiopsideDashboard",
    dashboard_name="Diopside-Operations"
)

# Lambda メトリクスウィジェット
dashboard.add_widgets(
    cloudwatch.GraphWidget(
        title="Lambda Function Metrics",
        left=[
            lambda_function.metric_invocations(),
            lambda_function.metric_errors(),
            lambda_function.metric_duration()
        ],
        width=12,
        height=6
    )
)

# DynamoDB メトリクスウィジェット
dashboard.add_widgets(
    cloudwatch.GraphWidget(
        title="DynamoDB Metrics",
        left=[
            table.metric_consumed_read_capacity_units(),
            table.metric_consumed_write_capacity_units()
        ],
        right=[
            table.metric_throttled_requests()
        ],
        width=12,
        height=6
    )
)
```

### 2. カスタムメトリクスダッシュボード

```python
# アプリケーション固有のメトリクス
dashboard.add_widgets(
    cloudwatch.GraphWidget(
        title="Application Metrics",
        left=[
            cloudwatch.Metric(
                namespace="Diopside/Application",
                metric_name="VideoRequests",
                statistic="Sum"
            ),
            cloudwatch.Metric(
                namespace="Diopside/Application",
                metric_name="ResponseTime",
                statistic="Average"
            )
        ],
        width=12,
        height=6
    )
)
```

## 運用手順

### 1. 日次監視チェックリスト

- [ ] Lambda 関数のエラー率確認
- [ ] DynamoDB のスロットリング確認
- [ ] CloudFront のキャッシュヒット率確認
- [ ] 全体的なレスポンス時間確認
- [ ] コスト使用量確認

### 2. 週次レビュー

- [ ] パフォーマンストレンド分析
- [ ] エラーパターンの分析
- [ ] キャパシティプランニング
- [ ] アラート設定の見直し

### 3. インシデント対応

#### エスカレーション手順
1. **重要度1（サービス停止）**: 即座に対応開始
2. **重要度2（パフォーマンス劣化）**: 2時間以内に対応開始
3. **重要度3（軽微な問題）**: 24時間以内に対応開始

#### ログ調査手順
```bash
# 1. エラーの特定
aws logs filter-log-events \
  --log-group-name "/aws/lambda/ShirayukiTomoFansite-FastAPIFunction" \
  --start-time $(date -d "1 hour ago" +%s)000 \
  --filter-pattern "ERROR"

# 2. 特定の request_id に関連するログを調査
aws logs filter-log-events \
  --log-group-name "/aws/lambda/ShirayukiTomoFansite-FastAPIFunction" \
  --filter-pattern "{ $.request_id = \"abc-123-def\" }"

# 3. X-Ray トレースの確認
aws xray get-trace-summaries \
  --time-range-type TimeRangeByStartTime \
  --start-time $(date -d "1 hour ago" +%s) \
  --end-time $(date +%s)
```

## コスト監視

### 1. Cost Explorer API
```bash
# 日次コスト確認
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-02 \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

### 2. 予算アラート
```python
# CDK での予算設定
from aws_cdk import aws_budgets as budgets

budget = budgets.CfnBudget(
    self, "DiopsideBudget",
    budget={
        "budgetName": "diopside-monthly-budget",
        "budgetLimit": {
            "amount": "50",
            "unit": "USD"
        },
        "timeUnit": "MONTHLY",
        "budgetType": "COST"
    },
    notifications_with_subscribers=[
        {
            "notification": {
                "notificationType": "ACTUAL",
                "comparisonOperator": "GREATER_THAN",
                "threshold": 80
            },
            "subscribers": [
                {
                    "subscriptionType": "EMAIL",
                    "address": "admin@example.com"
                }
            ]
        }
    ]
)
```

## トラブルシューティング

### よくある問題と対処法

#### Lambda タイムアウト
```python
# タイムアウトが頻発する場合の調査
# 1. メモリ使用量の確認
# 2. 外部API呼び出しの最適化
# 3. DynamoDB クエリの最適化
```

#### DynamoDB スロットリング
```python
# オンデマンド課金への変更を検討
# または適切なキャパシティプランニング
```

#### CloudFront キャッシュミス
```bash
# キャッシュポリシーの見直し
# 適切な Cache-Control ヘッダーの設定
```
