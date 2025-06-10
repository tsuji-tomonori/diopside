"""CloudFront distribution construct."""

from typing import Any, Self

import aws_cdk as cdk
from aws_cdk import aws_cloudfront as cloudfront, aws_cloudfront_origins as origins
from aws_cdk import aws_s3 as s3, aws_ssm as ssm
from constructs import Construct


class CloudFrontConstruct(Construct):
    """CloudFront distribution construct."""

    def __init__(
        self: Self,
        scope: Construct,
        construct_id: str,
        environment: str,
        s3_bucket: s3.Bucket,
        api_endpoint: str,
        **kwargs: Any,  # noqa: ANN401
    ) -> None:
        """Initialize CloudFront construct.
        
        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            environment: Environment name (dev/prod)
            s3_bucket: S3 bucket for static content
            api_endpoint: API Gateway endpoint URL
            **kwargs: Additional keyword arguments
        """
        super().__init__(scope, construct_id, **kwargs)

        self.env_name = environment
        
        # Get WebACL ARN from SSM Parameter
        web_acl_arn = ssm.StringParameter.value_for_string_parameter(
            self,
            parameter_name=f"/shirayuki-tomo-fansite/{self.env_name}/waf/webacl-arn",
        )

        # Create Origin Access Control for S3
        origin_access_control = cloudfront.S3OriginAccessControl(
            self,
            "OriginAccessControl",
            signing_behavior=cloudfront.OriginAccessControlSigningBehavior.ALWAYS,
            signing_protocol=cloudfront.OriginAccessControlSigningProtocol.SIGV4,
            origin_access_control_name=f"shirayuki-tomo-fansite-oac-{self.env_name}",
        )

        # Create CloudFront distribution
        self.distribution = cloudfront.Distribution(
            self,
            "Distribution",
            default_root_object="index.html",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3BucketOrigin.with_origin_access_control(
                    s3_bucket,
                    origin_access_control=origin_access_control,
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
                origin_request_policy=cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
                response_headers_policy=cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
            ),
            additional_behaviors={
                "/api/*": cloudfront.BehaviorOptions(
                    origin=origins.HttpOrigin(
                        domain_name=cdk.Fn.select(2, cdk.Fn.split("/", api_endpoint)),
                        origin_path="/",
                    ),
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cache_policy=cloudfront.CachePolicy.CACHING_DISABLED,
                    origin_request_policy=cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
                    allowed_methods=cloudfront.AllowedMethods.ALLOW_ALL,
                ),
            },
            error_responses=[
                cloudfront.ErrorResponse(
                    http_status=404,
                    response_http_status=200,
                    response_page_path="/index.html",
                ),
                cloudfront.ErrorResponse(
                    http_status=403,
                    response_http_status=200,
                    response_page_path="/index.html",
                ),
            ],
            web_acl_id=web_acl_arn,
            comment=f"Shirayuki Tomo fansite distribution - {self.env_name}",
        )

        # Grant CloudFront access to S3 bucket
        s3_bucket.add_to_resource_policy(
            cdk.aws_iam.PolicyStatement(
                effect=cdk.aws_iam.Effect.ALLOW,
                principals=[cdk.aws_iam.ServicePrincipal("cloudfront.amazonaws.com")],
                actions=["s3:GetObject"],
                resources=[f"{s3_bucket.bucket_arn}/*"],
                conditions={
                    "StringEquals": {
                        "AWS:SourceArn": f"arn:aws:cloudfront::{cdk.Aws.ACCOUNT_ID}:distribution/{self.distribution.distribution_id}"
                    }
                },
            )
        )

        # Output distribution domain name
        cdk.CfnOutput(
            self,
            "DistributionDomainName",
            value=self.distribution.distribution_domain_name,
            description=f"CloudFront distribution domain name for {self.env_name} environment",
        )

        # Output distribution URL
        cdk.CfnOutput(
            self,
            "DistributionUrl",
            value=f"https://{self.distribution.distribution_domain_name}",
            description=f"CloudFront distribution URL for {self.env_name} environment",
        )