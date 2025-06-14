"""Main stack for the Shirayuki Tomo fansite infrastructure."""

from typing import Any

import aws_cdk as cdk
from constructs import Construct

from .constructs import (
    ApiConstruct,
    CdnConstruct,
    LambdaConstruct,
    StorageConstruct,
    WafConstruct,
)


class MainStack(cdk.Stack):
    """Main stack containing all infrastructure components."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs: Any,
    ) -> None:
        """Initialize the main stack.

        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            **kwargs: Additional keyword arguments
        """
        super().__init__(scope, construct_id, **kwargs)

        # Environment is determined from stack name
        environment = "prod" if "prod" in construct_id.lower() else "dev"

        # Create WAF WebACL (must be in us-east-1 for CloudFront)
        waf_construct = WafConstruct(
            self,
            "Waf",
            environment=environment,
        )

        # Create storage resources
        storage_construct = StorageConstruct(
            self,
            "Storage",
            environment=environment,
        )

        # Create Lambda function with layers
        lambda_construct = LambdaConstruct(
            self,
            "Lambda",
            environment=environment,
            s3_bucket=storage_construct.s3_bucket,
            dynamodb_table=storage_construct.dynamodb_table,
        )

        # Create API Gateway
        api_construct = ApiConstruct(
            self,
            "Api",
            environment=environment,
            lambda_function=lambda_construct.lambda_function,
        )

        # Create CloudFront distribution
        cdn_construct = CdnConstruct(
            self,
            "Cdn",
            s3_bucket=storage_construct.s3_bucket,
            api_gateway=api_construct.api_gateway,
            web_acl_arn=waf_construct.web_acl.attr_arn,
        )

        # Store references for outputs
        self.s3_bucket = storage_construct.s3_bucket
        self.dynamodb_table = storage_construct.dynamodb_table
        self.lambda_function = lambda_construct.lambda_function
        self.api_gateway = api_construct.api_gateway
        self.cloudfront_distribution = cdn_construct.distribution
        self.web_acl = waf_construct.web_acl

        # Add outputs
        cdk.CfnOutput(
            self,
            "S3BucketName",
            value=self.s3_bucket.bucket_name,
            description="S3 bucket name for static hosting",
        )

        cdk.CfnOutput(
            self,
            "ApiEndpoint",
            value=self.api_gateway.url or "",
            description="API Gateway endpoint URL",
        )

        cdk.CfnOutput(
            self,
            "CloudFrontDistributionId",
            value=self.cloudfront_distribution.distribution_id,
            description="CloudFront distribution ID",
        )

        cdk.CfnOutput(
            self,
            "CloudFrontDomainName",
            value=self.cloudfront_distribution.distribution_domain_name,
            description="CloudFront distribution domain name",
        )

        # Add name tags to all resources
        self._add_name_tags()

    def _add_name_tags(self) -> None:
        """Add Name tags to all resources."""

        def add_name_tag_recursive(scope: Construct) -> None:
            for child in scope.node.children:
                if isinstance(child, cdk.CfnResource):
                    cdk.Tags.of(child).add("Name", child.node.path.replace("/", "-"))
                add_name_tag_recursive(child)

        add_name_tag_recursive(self)
