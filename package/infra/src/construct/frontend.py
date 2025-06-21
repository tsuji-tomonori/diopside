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

        # フォント用のキャッシュポリシーを作成
        font_cache_policy = cloudfront.CachePolicy(
            self,
            "FontCachePolicy",
            cache_policy_name=f"diopside-{environment.value}-font-cache-policy",
            comment="Cache policy for font files with CORS headers",
            default_ttl=cdk.Duration.days(365),
            max_ttl=cdk.Duration.days(365),
            min_ttl=cdk.Duration.seconds(0),
            cookie_behavior=cloudfront.CacheCookieBehavior.none(),
            header_behavior=cloudfront.CacheHeaderBehavior.allow_list(
                "Access-Control-Request-Headers",
                "Access-Control-Request-Method",
                "Origin",
            ),
            query_string_behavior=cloudfront.CacheQueryStringBehavior.none(),
            enable_accept_encoding_gzip=True,
            enable_accept_encoding_brotli=True,
        )

        # CloudFront Functionを作成してディレクトリアクセス時にindex.htmlを追加
        directory_index_function = cloudfront.Function(
            self,
            "DirectoryIndexFunction",
            code=cloudfront.FunctionCode.from_file(
                file_path="package/infra/src/cloudfront-functions/directory-index.js"
            ),
            comment="Add index.html to directory requests",
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
                function_associations=[
                    cloudfront.FunctionAssociation(
                        function=directory_index_function,
                        event_type=cloudfront.FunctionEventType.VIEWER_REQUEST,
                    )
                ],
            ),
            additional_behaviors={
                # フォントファイル用の専用ビヘイビア
                "*.woff": cloudfront.BehaviorOptions(
                    origin=origins.S3BucketOrigin.with_origin_access_control(
                        self.source.bucket
                    ),
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cache_policy=font_cache_policy,
                    compress=True,
                ),
                "*.woff2": cloudfront.BehaviorOptions(
                    origin=origins.S3BucketOrigin.with_origin_access_control(
                        self.source.bucket
                    ),
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cache_policy=font_cache_policy,
                    compress=True,
                ),
                "*.ttf": cloudfront.BehaviorOptions(
                    origin=origins.S3BucketOrigin.with_origin_access_control(
                        self.source.bucket
                    ),
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cache_policy=font_cache_policy,
                    compress=True,
                ),
                "*.otf": cloudfront.BehaviorOptions(
                    origin=origins.S3BucketOrigin.with_origin_access_control(
                        self.source.bucket
                    ),
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cache_policy=font_cache_policy,
                    compress=True,
                ),
                # Next.jsの静的ファイル用
                "_next/static/*": cloudfront.BehaviorOptions(
                    origin=origins.S3BucketOrigin.with_origin_access_control(
                        self.source.bucket
                    ),
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cache_policy=font_cache_policy,
                    compress=True,
                ),
            },
            error_responses=[
                # 静的エクスポート用: 404エラーの場合は適切なindex.htmlを返す
                cloudfront.ErrorResponse(
                    http_status=404,
                    response_http_status=200,
                    response_page_path="/index.html",
                    ttl=cdk.Duration.minutes(5),
                ),
                # 403エラーの場合も同様
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
