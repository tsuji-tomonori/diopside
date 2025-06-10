"""Test cases for CDK stacks."""

import aws_cdk as cdk
import pytest
from aws_cdk import assertions

from stacks.dev_stack import DevStack
from stacks.prod_stack import ProdStack


class TestDevStack:
    """Test cases for development stack."""

    @pytest.fixture
    def app(self) -> cdk.App:
        """Create CDK app for testing."""
        return cdk.App()

    @pytest.fixture
    def dev_stack(self, app: cdk.App) -> DevStack:
        """Create development stack for testing."""
        return DevStack(
            app,
            "TestDevStack",
            env=cdk.Environment(account="123456789012", region="ap-northeast-1"),
        )

    def test_s3_bucket_created(self, dev_stack: DevStack) -> None:
        """Test that S3 bucket is created with correct properties."""
        template = assertions.Template.from_stack(dev_stack)
        
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "VersioningConfiguration": {"Status": "Enabled"},
                "PublicAccessBlockConfiguration": {
                    "BlockPublicAcls": True,
                    "BlockPublicPolicy": True,
                    "IgnorePublicAcls": True,
                    "RestrictPublicBuckets": True,
                },
            },
        )

    def test_dynamodb_table_created(self, dev_stack: DevStack) -> None:
        """Test that DynamoDB table is created with correct properties."""
        template = assertions.Template.from_stack(dev_stack)
        
        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {
                "BillingMode": "PAY_PER_REQUEST",
                "KeySchema": [
                    {"AttributeName": "PK", "KeyType": "HASH"},
                    {"AttributeName": "SK", "KeyType": "RANGE"},
                ],
                "AttributeDefinitions": [
                    {"AttributeName": "PK", "AttributeType": "S"},
                    {"AttributeName": "SK", "AttributeType": "S"},
                    {"AttributeName": "Tag", "AttributeType": "S"},
                ],
                "GlobalSecondaryIndexes": [
                    {
                        "IndexName": "ByTag",
                        "KeySchema": [
                            {"AttributeName": "Tag", "KeyType": "HASH"},
                            {"AttributeName": "SK", "KeyType": "RANGE"},
                        ],
                        "Projection": {"ProjectionType": "ALL"},
                    }
                ],
            },
        )

    def test_lambda_function_created(self, dev_stack: DevStack) -> None:
        """Test that Lambda function is created with correct properties."""
        template = assertions.Template.from_stack(dev_stack)
        
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "Runtime": "python3.13",
                "Handler": "main.handler",
                "MemorySize": 128,
                "Timeout": 30,
                "TracingConfig": {"Mode": "Active"},
            },
        )

    def test_api_gateway_created(self, dev_stack: DevStack) -> None:
        """Test that API Gateway is created."""
        template = assertions.Template.from_stack(dev_stack)
        
        template.has_resource("AWS::ApiGatewayV2::Api", {})

    def test_cloudfront_distribution_created(self, dev_stack: DevStack) -> None:
        """Test that CloudFront distribution is created."""
        template = assertions.Template.from_stack(dev_stack)
        
        template.has_resource("AWS::CloudFront::Distribution", {})

    def test_waf_created(self, dev_stack: DevStack) -> None:
        """Test that WAF is created."""
        template = assertions.Template.from_stack(dev_stack)
        
        template.has_resource_properties(
            "AWS::WAFv2::WebACL",
            {
                "Scope": "CLOUDFRONT",
            },
        )


class TestProdStack:
    """Test cases for production stack."""

    @pytest.fixture
    def app(self) -> cdk.App:
        """Create CDK app for testing."""
        return cdk.App()

    @pytest.fixture
    def prod_stack(self, app: cdk.App) -> ProdStack:
        """Create production stack for testing."""
        return ProdStack(
            app,
            "TestProdStack",
            env=cdk.Environment(account="123456789012", region="ap-northeast-1"),
        )

    def test_prod_stack_resources_created(self, prod_stack: ProdStack) -> None:
        """Test that production stack has all required resources."""
        template = assertions.Template.from_stack(prod_stack)
        
        # Check that all main resources are present
        template.has_resource("AWS::S3::Bucket", {})
        template.has_resource("AWS::DynamoDB::Table", {})
        template.has_resource("AWS::Lambda::Function", {})
        template.has_resource("AWS::ApiGatewayV2::Api", {})
        template.has_resource("AWS::CloudFront::Distribution", {})
        template.has_resource("AWS::WAFv2::WebACL", {})

    def test_resource_count(self, prod_stack: ProdStack) -> None:
        """Test that the stack has expected number of resources."""
        template = assertions.Template.from_stack(prod_stack)
        
        # Verify we have at least the core resources
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        # Lambda functions may include additional functions created by CDK
        template.resource_count_is("AWS::ApiGatewayV2::Api", 1)
        template.resource_count_is("AWS::CloudFront::Distribution", 1)
        template.resource_count_is("AWS::WAFv2::WebACL", 1)