"""Base stack with common infrastructure components."""

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
    aws_ssm as ssm,
)
from constructs import Construct


class BaseStack(cdk.Stack):
    """Base stack containing common infrastructure components."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment: str,
        web_acl_arn: str | None = None,
        **kwargs: Any,
    ) -> None:
        """Initialize the base stack.

        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            environment: Environment name (dev/prod)
            web_acl_arn: WebACL ARN from WAF stack (optional, will be fetched from SSM if not provided)
            **kwargs: Additional keyword arguments
        """
        super().__init__(scope, construct_id, **kwargs)

        self.env_name = environment

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

        # Create S3 bucket for static hosting and thumbnails
        self.s3_bucket = self._create_s3_bucket()

        # Create DynamoDB table for archive metadata
        self.dynamodb_table = self._create_dynamodb_table()

        # Create Lambda function for FastAPI
        self.lambda_function = self._create_lambda_function()

        # Create API Gateway
        self.api_gateway = self._create_api_gateway()

        # Create CloudFront distribution
        self.cloudfront_distribution = self._create_cloudfront_distribution()

        # Add name tags to all resources
        self._add_name_tags()

    def _create_s3_bucket(self) -> s3.Bucket:
        """Create S3 bucket for static hosting and thumbnails."""
        bucket = s3.Bucket(
            self,
            "StaticHostingBucket",
            bucket_name=f"shirayuki-tomo-fansite-{self.env_name}-{self.account}",
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
            if self.env_name == "prod"
            else cdk.RemovalPolicy.DESTROY,
        )

        return bucket

    def _create_dynamodb_table(self) -> dynamodb.Table:
        """Create DynamoDB table for archive metadata."""
        table = dynamodb.Table(
            self,
            "ArchiveMetadataTable",
            table_name=f"ArchiveMetadata-{self.env_name}",
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
            if self.env_name == "prod"
            else cdk.RemovalPolicy.DESTROY,
        )

        # Add GSI for tag-based queries
        table.add_global_secondary_index(
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

        return table

    def _create_lambda_function(self) -> lambda_.Function:
        """Create Lambda function for FastAPI endpoints."""
        # Create IAM role for Lambda
        lambda_role = iam.Role(
            self,
            "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                ),
            ],
        )

        # Add permissions for S3 and DynamoDB
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["s3:GetObject", "s3:PutObject"],
                resources=[f"{self.s3_bucket.bucket_arn}/*"],
            )
        )

        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:Query",
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                ],
                resources=[
                    self.dynamodb_table.table_arn,
                    f"{self.dynamodb_table.table_arn}/index/*",
                ],
            )
        )

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
            self,
            "FastAPIFunction",
            runtime=lambda_.Runtime.PYTHON_3_13,
            handler="main.handler",
            code=lambda_.Code.from_asset("../backend"),
            memory_size=256,  # Increased memory for better performance
            timeout=cdk.Duration.seconds(30),
            role=lambda_role,
            layers=[dependencies_layer, powertools_layer],
            environment={
                "DYNAMODB_TABLE_NAME": self.dynamodb_table.table_name,
                "S3_BUCKET_NAME": self.s3_bucket.bucket_name,
                "ENVIRONMENT": self.env_name,
                "POWERTOOLS_SERVICE_NAME": "shirayuki-tomo-fansite",
                "POWERTOOLS_METRICS_NAMESPACE": "ShirayukiTomoFansite",
            },
            tracing=lambda_.Tracing.ACTIVE,
            log_retention=logs.RetentionDays.ONE_WEEK
            if self.env_name == "dev"
            else logs.RetentionDays.ONE_MONTH,
        )

        return function

    def _create_api_gateway(self) -> apigwv2.HttpApi:
        """Create API Gateway HTTP API."""
        api = apigwv2.HttpApi(
            self,
            "HttpApi",
            api_name=f"shirayuki-tomo-fansite-api-{self.env_name}",
            cors_preflight=apigwv2.CorsPreflightOptions(
                allow_origins=["*"],
                allow_methods=[apigwv2.CorsHttpMethod.ANY],
                allow_headers=["*"],
            ),
        )

        # Add Lambda integration
        integration = apigwv2_integrations.HttpLambdaIntegration(
            "LambdaIntegration",
            self.lambda_function,
        )

        api.add_routes(
            path="/{proxy+}",
            methods=[apigwv2.HttpMethod.ANY],
            integration=integration,
        )

        return api

    def _create_cloudfront_distribution(self) -> cloudfront.Distribution:
        """Create CloudFront distribution."""
        # Create Origin Access Control (OAC) - recommended over OAI
        oac = cloudfront.S3OriginAccessControl(
            self,
            "OriginAccessControl",
            description=f"OAC for {self.env_name} environment",
        )

        distribution = cloudfront.Distribution(
            self,
            "CloudFrontDistribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3BucketOrigin(
                    self.s3_bucket,
                    origin_access_control_id=oac.origin_access_control_id,
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
                compress=True,
            ),
            additional_behaviors={
                "/api/*": cloudfront.BehaviorOptions(
                    origin=origins.HttpOrigin(
                        f"{self.api_gateway.http_api_id}.execute-api.{self.region}.amazonaws.com",
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
            web_acl_id=self.web_acl_arn,
        )

        # Grant CloudFront access to S3 bucket via bucket policy
        self.s3_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("cloudfront.amazonaws.com")],
                actions=["s3:GetObject"],
                resources=[f"{self.s3_bucket.bucket_arn}/*"],
                conditions={
                    "StringEquals": {
                        "AWS:SourceArn": f"arn:aws:cloudfront::{self.account}:distribution/{distribution.distribution_id}"
                    }
                },
            )
        )

        return distribution

    def _add_name_tags(self) -> None:
        """Add Name tags to all resources."""

        def add_name_tag_recursive(scope: Construct) -> None:
            for child in scope.node.children:
                if isinstance(child, cdk.CfnResource):
                    cdk.Tags.of(child).add("Name", child.node.path.replace("/", "-"))
                add_name_tag_recursive(child)

        add_name_tag_recursive(self)
