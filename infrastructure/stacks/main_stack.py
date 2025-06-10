"""Main application stack using construct pattern."""

from typing import Any, Self

import aws_cdk as cdk
from constructs import Construct

from constructs.api import ApiGatewayConstruct
from constructs.cloudfront import CloudFrontConstruct
from constructs.function import LambdaConstruct
from constructs.storage import DynamoDBConstruct, S3Construct


class MainStack(cdk.Stack):
    """Main application stack containing all infrastructure components."""

    def __init__(
        self: Self,
        scope: Construct,
        construct_id: str,
        environment: str,
        **kwargs: Any,  # noqa: ANN401
    ) -> None:
        """Initialize main stack.
        
        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            environment: Environment name (dev/prod)
            **kwargs: Additional keyword arguments
        """
        super().__init__(scope, construct_id, **kwargs)

        self.env_name = environment
        
        # Create storage components
        self.s3 = S3Construct(
            self,
            "S3",
            environment=environment,
        )
        
        self.dynamodb = DynamoDBConstruct(
            self,
            "DynamoDB",
            environment=environment,
        )
        
        # Create Lambda function
        self.lambda_function = LambdaConstruct(
            self,
            "Lambda",
            environment=environment,
        )
        
        # Grant Lambda access to resources
        self.lambda_function.grant_dynamodb_access(self.dynamodb.table.table_arn)
        self.lambda_function.grant_s3_access(self.s3.bucket.bucket_arn)
        
        # Add environment variables to Lambda
        self.lambda_function.add_environment_variable("DYNAMODB_TABLE_NAME", self.dynamodb.table.table_name)
        self.lambda_function.add_environment_variable("S3_BUCKET_NAME", self.s3.bucket.bucket_name)
        
        # Create API Gateway
        self.api = ApiGatewayConstruct(
            self,
            "Api",
            environment=environment,
            lambda_function=self.lambda_function.function,
        )
        
        # Create CloudFront distribution
        self.cloudfront = CloudFrontConstruct(
            self,
            "CloudFront",
            environment=environment,
            s3_bucket=self.s3.bucket,
            api_endpoint=self.api.api.api_endpoint,
        )