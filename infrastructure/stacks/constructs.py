"""Constructs for the Shirayuki Tomo fansite infrastructure."""

from typing import Any

import aws_cdk as cdk
from aws_cdk import (
    aws_apigatewayv2 as apigwv2,
    aws_apigatewayv2_integrations as apigwv2_integrations,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_lambda as lambda_,
    aws_logs as logs,
    aws_s3 as s3,
    aws_wafv2 as wafv2,
)
from constructs import Construct


class StorageConstruct(Construct):
    """Construct for S3 bucket and DynamoDB table."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment: str,
        **kwargs: Any,
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.environment = environment

        # Create S3 bucket for static hosting and thumbnails
        self.s3_bucket = s3.Bucket(
            self,
            "StaticHostingBucket",
            bucket_name=f"shirayuki-tomo-fansite-{environment}-{cdk.Aws.ACCOUNT_ID}",
            versioned=True,
            public_read_access=False,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldLogs",
                    enabled=True,
                    expiration=cdk.Duration.days(90),
                    noncurrent_version_expiration=cdk.Duration.days(30),
                )
            ],
            removal_policy=cdk.RemovalPolicy.RETAIN
            if environment == "prod"
            else cdk.RemovalPolicy.DESTROY,
        )

        # Create DynamoDB table for archive metadata
        self.dynamodb_table = dynamodb.Table(
            self,
            "ArchiveMetadataTable",
            table_name=f"ArchiveMetadata-{environment}",
            partition_key=dynamodb.Attribute(
                name="PK",
                type=dynamodb.AttributeType.STRING,
            ),
            sort_key=dynamodb.Attribute(
                name="SK",
                type=dynamodb.AttributeType.STRING,
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=cdk.RemovalPolicy.RETAIN
            if environment == "prod"
            else cdk.RemovalPolicy.DESTROY,
        )

        # Add GSI for tag-based queries
        self.dynamodb_table.add_global_secondary_index(
            index_name="ByTag",
            partition_key=dynamodb.Attribute(
                name="Tag",
                type=dynamodb.AttributeType.STRING,
            ),
            sort_key=dynamodb.Attribute(
                name="SK",
                type=dynamodb.AttributeType.STRING,
            ),
        )


class LambdaConstruct(Construct):
    """Construct for Lambda function with layers."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment: str,
        s3_bucket: s3.Bucket,
        dynamodb_table: dynamodb.Table,
        **kwargs: Any,
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.environment = environment

        # Create Lambda layer for dependencies
        self.dependencies_layer = lambda_.LayerVersion(
            self,
            "DependenciesLayer",
            code=lambda_.Code.from_asset(".layers"),
            compatible_runtimes=[lambda_.Runtime.PYTHON_3_13],
            description="FastAPI and other dependencies for the backend",
        )

        # Get AWS Lambda Powertools layer ARN for the current region
        self.powertools_layer = lambda_.LayerVersion.from_layer_version_arn(
            self,
            "PowertoolsLayer",
            layer_version_arn=f"arn:aws:lambda:{cdk.Aws.REGION}:017000801446:layer:AWSLambdaPowertoolsPythonV2:40",
        )

        # Create Lambda function for FastAPI
        self.lambda_function = lambda_.Function(
            self,
            "FastAPIFunction",
            runtime=lambda_.Runtime.PYTHON_3_13,
            handler="main.handler",  # Fixed handler path for backend/app structure
            code=lambda_.Code.from_asset("../backend/app"),  # Fixed path to backend/app
            memory_size=256,
            timeout=cdk.Duration.seconds(30),
            layers=[self.dependencies_layer, self.powertools_layer],
            environment={
                "DYNAMODB_TABLE_NAME": dynamodb_table.table_name,
                "S3_BUCKET_NAME": s3_bucket.bucket_name,
                "ENVIRONMENT": environment,
                "POWERTOOLS_SERVICE_NAME": "shirayuki-tomo-fansite",
                "POWERTOOLS_METRICS_NAMESPACE": "ShirayukiTomoFansite",
            },
            tracing=lambda_.Tracing.ACTIVE,
            log_retention=logs.RetentionDays.ONE_WEEK
            if environment == "dev"
            else logs.RetentionDays.ONE_MONTH,
        )

        # Grant permissions using grant methods
        s3_bucket.grant_read_write(self.lambda_function)
        dynamodb_table.grant_read_write_data(self.lambda_function)


class ApiConstruct(Construct):
    """Construct for API Gateway."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment: str,
        lambda_function: lambda_.Function,
        **kwargs: Any,
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create API Gateway HTTP API
        self.api_gateway = apigwv2.HttpApi(
            self,
            "HttpApi",
            api_name=f"shirayuki-tomo-fansite-api-{environment}",
            cors_preflight=apigwv2.CorsPreflightOptions(
                allow_origins=["*"],
                allow_methods=[apigwv2.CorsHttpMethod.ANY],
                allow_headers=["*"],
            ),
        )

        # Add Lambda integration
        integration = apigwv2_integrations.HttpLambdaIntegration(
            "LambdaIntegration",
            lambda_function,
        )

        self.api_gateway.add_routes(
            path="/{proxy+}",
            methods=[apigwv2.HttpMethod.ANY],
            integration=integration,
        )


class WafConstruct(Construct):
    """Construct for WAF WebACL."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment: str,
        **kwargs: Any,
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create WAF WebACL
        self.web_acl = wafv2.CfnWebACL(
            self,
            "WebACL",
            scope="CLOUDFRONT",
            default_action=wafv2.CfnWebACL.DefaultActionProperty(allow={}),
            rules=[
                wafv2.CfnWebACL.RuleProperty(
                    name="AWSManagedRulesCommonRuleSet",
                    priority=1,
                    override_action=wafv2.CfnWebACL.OverrideActionProperty(none={}),
                    statement=wafv2.CfnWebACL.StatementProperty(
                        managed_rule_group_statement=wafv2.CfnWebACL.ManagedRuleGroupStatementProperty(
                            vendor_name="AWS",
                            name="AWSManagedRulesCommonRuleSet",
                        )
                    ),
                    visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                        sampled_requests_enabled=True,
                        cloud_watch_metrics_enabled=True,
                        metric_name="CommonRuleSetMetric",
                    ),
                ),
                wafv2.CfnWebACL.RuleProperty(
                    name="AWSManagedRulesKnownBadInputsRuleSet",
                    priority=2,
                    override_action=wafv2.CfnWebACL.OverrideActionProperty(none={}),
                    statement=wafv2.CfnWebACL.StatementProperty(
                        managed_rule_group_statement=wafv2.CfnWebACL.ManagedRuleGroupStatementProperty(
                            vendor_name="AWS",
                            name="AWSManagedRulesKnownBadInputsRuleSet",
                        )
                    ),
                    visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                        sampled_requests_enabled=True,
                        cloud_watch_metrics_enabled=True,
                        metric_name="KnownBadInputsRuleSetMetric",
                    ),
                ),
            ],
            visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                sampled_requests_enabled=True,
                cloud_watch_metrics_enabled=True,
                metric_name=f"shirayuki-tomo-fansite-{environment}-waf",
            ),
        )


class CdnConstruct(Construct):
    """Construct for CloudFront distribution."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        s3_bucket: s3.Bucket,
        api_gateway: apigwv2.HttpApi,
        web_acl_arn: str,
        **kwargs: Any,
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create Origin Access Control (OAC)
        oac = cloudfront.S3OriginAccessControl(
            self,
            "OriginAccessControl",
            description="OAC for Shirayuki Tomo fansite",
        )

        # Create CloudFront distribution
        self.distribution = cloudfront.Distribution(
            self,
            "CloudFrontDistribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3BucketOrigin(
                    s3_bucket,
                    origin_access_control_id=oac.origin_access_control_id,
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
                compress=True,
            ),
            additional_behaviors={
                "/api/*": cloudfront.BehaviorOptions(
                    origin=origins.HttpOrigin(
                        f"{api_gateway.http_api_id}.execute-api.{cdk.Aws.REGION}.amazonaws.com",
                    ),
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cache_policy=cloudfront.CachePolicy.CACHING_DISABLED,
                    origin_request_policy=cloudfront.OriginRequestPolicy.ALL_VIEWER,
                ),
            },
            default_root_object="index.html",
            error_responses=[
                cloudfront.ErrorResponse(
                    http_status=404,
                    response_http_status=200,
                    response_page_path="/index.html",
                ),
            ],
            web_acl_id=web_acl_arn,
        )

        # Grant CloudFront access to S3 bucket via bucket policy
        s3_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("cloudfront.amazonaws.com")],
                actions=["s3:GetObject"],
                resources=[f"{s3_bucket.bucket_arn}/*"],
                conditions={
                    "StringEquals": {
                        "AWS:SourceArn": f"arn:aws:cloudfront::{cdk.Aws.ACCOUNT_ID}:distribution/{self.distribution.distribution_id}"
                    }
                },
            )
        )