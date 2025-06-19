from typing import Any, Self

import aws_cdk as cdk
from aws_cdk import aws_cloudfront as cloudfront
from aws_cdk import aws_cloudfront_origins as origins
from aws_cdk import aws_iam
from aws_cdk import aws_s3_deployment as deployment
from constructs import Construct
from src.construct.resource.bucket import S3Construct
from src.model.env import Env


class FrontEndConstruct(Construct):
    """Frontend construct with CloudFront and S3."""

    def __init__(
        self: Self,
        scope: Construct,
        construct_id: str,
        environment: Env,
        api_url: str,
        # web_acl_arn: str,
        **kwargs: Any,  # noqa: ANN401
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.source = S3Construct(
            self,
            "S3",
            environment=environment,
        )

        self.static_distribution = cloudfront.Distribution(
            self,
            "Distribution",
            default_root_object="index.html",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3BucketOrigin.with_origin_access_control(
                    self.source.bucket
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
            ),
            error_responses=[
                # SPA routing support: 404/403 errors should return index.html
                cloudfront.ErrorResponse(
                    http_status=404,
                    response_http_status=200,
                    response_page_path="/index.html",
                    ttl=cdk.Duration.minutes(5),
                ),
                cloudfront.ErrorResponse(
                    http_status=403,
                    response_http_status=200,
                    response_page_path="/index.html",
                    ttl=cdk.Duration.minutes(5),
                ),
            ],
            # web_acl_id=web_acl_arn,
        )

        # 通常のデプロイメント（事前にビルドされたファイルを使用）
        self.deployment = deployment.BucketDeployment(
            self,
            "DeployStaticWebsite",
            sources=[deployment.Source.asset("package/web/out")],
            destination_bucket=self.source.bucket,
            distribution=self.static_distribution,
            distribution_paths=["/*"],
        )

        # 環境変数ファイルを作成するカスタムリソース（デプロイ後に上書き）
        from aws_cdk import custom_resources as cr

        # API URLを設定ファイルとして作成（Next.jsのpublicフォルダーのconfig.jsonを上書き）
        env_file_creator = cr.AwsCustomResource(
            self,
            "CreateEnvFile",
            on_create=cr.AwsSdkCall(
                service="S3",
                action="putObject",
                parameters={
                    "Bucket": self.source.bucket.bucket_name,
                    "Key": "config.json",  # Next.jsのpublicフォルダーから配置されたファイルを上書き
                    "Body": f'{{"NEXT_PUBLIC_API_URL": "{api_url}"}}',
                    "ContentType": "application/json",
                    "CacheControl": "no-cache, no-store, must-revalidate",  # キャッシュを無効化
                },
                physical_resource_id=cr.PhysicalResourceId.of("config-file"),
            ),
            on_update=cr.AwsSdkCall(
                service="S3",
                action="putObject",
                parameters={
                    "Bucket": self.source.bucket.bucket_name,
                    "Key": "config.json",
                    "Body": f'{{"NEXT_PUBLIC_API_URL": "{api_url}"}}',
                    "ContentType": "application/json",
                    "CacheControl": "no-cache, no-store, must-revalidate",
                },
                physical_resource_id=cr.PhysicalResourceId.of("config-file"),
            ),
            policy=cr.AwsCustomResourcePolicy.from_statements(
                [
                    aws_iam.PolicyStatement(
                        actions=["s3:PutObject"],
                        resources=[f"{self.source.bucket.bucket_arn}/*"],
                    )
                ]
            ),
        )

        # デプロイメント完了後に設定ファイルを上書き
        env_file_creator.node.add_dependency(self.deployment)

        # CloudFrontのキャッシュを無効化（設定ファイル更新時のみ）
        from aws_cdk import custom_resources as cr2

        cache_invalidation = cr2.AwsCustomResource(
            self,
            "InvalidateConfigCache",
            on_create=cr2.AwsSdkCall(
                service="CloudFront",
                action="createInvalidation",
                parameters={
                    "DistributionId": self.static_distribution.distribution_id,
                    "InvalidationBatch": {
                        "Paths": {"Quantity": 1, "Items": ["/config.json"]},
                        "CallerReference": f"config-invalidation-{cdk.Aws.STACK_NAME}",
                    },
                },
                physical_resource_id=cr2.PhysicalResourceId.of(
                    "config-cache-invalidation"
                ),
            ),
            on_update=cr2.AwsSdkCall(
                service="CloudFront",
                action="createInvalidation",
                parameters={
                    "DistributionId": self.static_distribution.distribution_id,
                    "InvalidationBatch": {
                        "Paths": {"Quantity": 1, "Items": ["/config.json"]},
                        "CallerReference": f"config-invalidation-{cdk.Aws.STACK_NAME}-{cdk.Aws.REGION}",
                    },
                },
                physical_resource_id=cr2.PhysicalResourceId.of(
                    "config-cache-invalidation"
                ),
            ),
            policy=cr2.AwsCustomResourcePolicy.from_statements(
                [
                    aws_iam.PolicyStatement(
                        actions=["cloudfront:CreateInvalidation"],
                        resources=["*"],
                    )
                ]
            ),
        )

        # 設定ファイル作成後にキャッシュ無効化
        cache_invalidation.node.add_dependency(env_file_creator)

        # output
        cdk.CfnOutput(
            self,
            "static_web_url",
            value=f"https://{self.static_distribution.domain_name}",
        )

        cdk.Tags.of(self).add("Public", "True")
