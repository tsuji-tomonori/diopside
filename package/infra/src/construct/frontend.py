from typing import Any, Self

import aws_cdk as cdk
from aws_cdk import Stack
from aws_cdk import aws_cloudfront as cloudfront
from aws_cdk import aws_cloudfront_origins as origins
from aws_cdk import aws_s3_deployment as deployment
from constructs import Construct
from src.construct.resource.bucket import S3Construct
from src.model.env import Env


class FrontEndStack(Stack):
    def __init__(
        self: Self,
        scope: Construct,
        construct_id: str,
        environment: Env,
        # web_acl_arn: str,
        **kwargs: Any,  # noqa: ANN401
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        source = S3Construct(
            self,
            "S3",
            environment=environment,
        )

        static_distribution = cloudfront.Distribution(
            self,
            "Distribution",
            default_root_object="index.html",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3BucketOrigin.with_origin_access_control(source.bucket),
            ),
            # web_acl_id=web_acl_arn,
        )

        deployment.BucketDeployment(
            self,
            "DeployStaticWebsite",
            sources=[deployment.Source.asset("package/web/out")],
            destination_bucket=source.bucket,
            distribution=static_distribution,
            distribution_paths=["/*"],
        )

        # output
        cdk.CfnOutput(
            self,
            "static_web_url",
            value=f"https://{static_distribution.domain_name}",
        )

        cdk.Tags.of(self).add("Public", "True")
