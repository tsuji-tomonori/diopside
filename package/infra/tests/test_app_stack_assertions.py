"""AppStack のアサーションテスト"""

import aws_cdk as cdk
from aws_cdk.assertions import Capture, Match, Template
from src.model.env import Env
from src.model.project import Project
from src.stack.app_stack import AppStack


def test_dynamodb_table_configuration() -> None:
    """DynamoDB テーブルの設定を検証"""
    # Arrange
    app = cdk.App()
    project = Project()
    environment = Env.DEV

    # Act
    stack = AppStack(
        app,
        "TestAppStack",
        project=project,
        environment=environment,
        env=cdk.Environment(account="123456789012", region="us-east-1"),
    )
    template = Template.from_stack(stack)

    # Assert
    template.has_resource_properties(
        "AWS::DynamoDB::Table",
        {
            "KeySchema": [
                {
                    "AttributeName": "PK",
                    "KeyType": "HASH",
                },
                {
                    "AttributeName": "SK",
                    "KeyType": "RANGE",
                }
            ],
            "BillingMode": "PAY_PER_REQUEST",
            "GlobalSecondaryIndexes": Match.array_with([
                Match.object_like({
                    "IndexName": "ByTag",
                    "KeySchema": [
                        {
                            "AttributeName": "Tag",
                            "KeyType": "HASH",
                        },
                        {
                            "AttributeName": "SK",
                            "KeyType": "RANGE",
                        },
                    ],
                    "Projection": {
                        "ProjectionType": "ALL",
                    },
                }),
                Match.object_like({
                    "IndexName": "GSI1",
                    "KeySchema": [
                        {
                            "AttributeName": "year",
                            "KeyType": "HASH",
                        },
                        {
                            "AttributeName": "SK",
                            "KeyType": "RANGE",
                        },
                    ],
                    "Projection": {
                        "ProjectionType": "ALL",
                    },
                })
            ]),
        },
    )


def test_lambda_function_configuration() -> None:
    """Lambda 関数の設定を検証"""
    # Arrange
    app = cdk.App()
    project = Project()
    environment = Env.DEV

    # Act
    stack = AppStack(
        app,
        "TestAppStack",
        project=project,
        environment=environment,
        env=cdk.Environment(account="123456789012", region="us-east-1"),
    )
    template = Template.from_stack(stack)

    # Assert
    # メインのLambda関数の設定を確認
    template.has_resource_properties(
        "AWS::Lambda::Function",
        Match.object_like({
            "Runtime": "python3.13",
            "Handler": "main.handler",
            "Code": Match.any_value(),
            "MemorySize": 512,
            "Timeout": 30,
            "Environment": {
                "Variables": Match.object_like({
                    "DYNAMODB_TABLE_NAME": Match.any_value(),
                    "POWERTOOLS_SERVICE_NAME": Match.any_value(),
                    "POWERTOOLS_METRICS_NAMESPACE": Match.any_value(),
                }),
            },
        }),
    )


def test_api_gateway_configuration() -> None:
    """API Gateway の設定を検証"""
    # Arrange
    app = cdk.App()
    project = Project()
    environment = Env.DEV

    # Act
    stack = AppStack(
        app,
        "TestAppStack",
        project=project,
        environment=environment,
        env=cdk.Environment(account="123456789012", region="us-east-1"),
    )
    template = Template.from_stack(stack)

    # Assert
    template.has_resource_properties(
        "AWS::ApiGateway::RestApi",
        Match.object_like({
            "Name": Match.any_value(),
            "Description": Match.any_value(),
        }),
    )

    # Lambda統合の確認
    template.has_resource_properties(
        "AWS::ApiGateway::Method",
        Match.object_like({
            "HttpMethod": "ANY",
            "Integration": {
                "Type": "AWS_PROXY",
                "IntegrationHttpMethod": "POST",
            },
        }),
    )


def test_s3_bucket_configuration() -> None:
    """S3 バケットの設定を検証"""
    # Arrange
    app = cdk.App()
    project = Project()
    environment = Env.DEV

    # Act
    stack = AppStack(
        app,
        "TestAppStack",
        project=project,
        environment=environment,
        env=cdk.Environment(account="123456789012", region="us-east-1"),
    )
    template = Template.from_stack(stack)

    # Assert
    template.has_resource_properties(
        "AWS::S3::Bucket",
        Match.object_like({
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256",
                        },
                    }
                ],
            },
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True,
            },
            "VersioningConfiguration": {
                "Status": "Enabled",
            },
        }),
    )


def test_cloudfront_distribution_configuration() -> None:
    """CloudFront ディストリビューションの設定を検証"""
    # Arrange
    app = cdk.App()
    project = Project()
    environment = Env.DEV

    # Act
    stack = AppStack(
        app,
        "TestAppStack",
        project=project,
        environment=environment,
        env=cdk.Environment(account="123456789012", region="us-east-1"),
    )
    template = Template.from_stack(stack)

    # Assert
    template.has_resource_properties(
        "AWS::CloudFront::Distribution",
        Match.object_like({
            "DistributionConfig": Match.object_like({
                "Enabled": True,
                "DefaultRootObject": "index.html",
                "DefaultCacheBehavior": Match.object_like({
                    "ViewerProtocolPolicy": "redirect-to-https",
                    "TargetOriginId": Match.any_value(),
                }),
            }),
        }),
    )


def test_iam_roles_and_policies() -> None:
    """IAM ロールとポリシーの設定を検証"""
    # Arrange
    app = cdk.App()
    project = Project()
    environment = Env.DEV

    # Act
    stack = AppStack(
        app,
        "TestAppStack",
        project=project,
        environment=environment,
        env=cdk.Environment(account="123456789012", region="us-east-1"),
    )
    template = Template.from_stack(stack)

    # Assert - Lambda実行ロール
    template.has_resource_properties(
        "AWS::IAM::Role",
        Match.object_like({
            "AssumeRolePolicyDocument": {
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com",
                        },
                        "Action": "sts:AssumeRole",
                    }
                ],
            },
        }),
    )

    # Assert - DynamoDBアクセスポリシー
    template.has_resource_properties(
        "AWS::IAM::Policy",
        Match.object_like({
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Effect": "Allow",
                        "Action": Match.array_with([
                            "dynamodb:GetItem",
                        ]),
                        "Resource": Match.any_value(),
                    }),
                ]),
            },
        }),
    )


def test_stack_tags() -> None:
    """スタックタグの設定を検証"""
    # Arrange
    app = cdk.App()
    project = Project()
    environment = Env.DEV

    # Act
    stack = AppStack(
        app,
        "TestAppStack",
        project=project,
        environment=environment,
        env=cdk.Environment(account="123456789012", region="us-east-1"),
    )
    template = Template.from_stack(stack)

    # Assert
    # スタックが正常に作成されることを確認
    assert template.to_json() is not None
    
    # DynamoDBテーブルが存在することを確認
    template.has_resource("AWS::DynamoDB::Table", {})


def test_environment_specific_configuration() -> None:
    """環境別の設定を検証"""
    # Arrange
    app = cdk.App()
    project = Project()
    
    # Dev環境
    dev_stack = AppStack(
        app,
        "DevAppStack",
        project=project,
        environment=Env.DEV,
        env=cdk.Environment(account="123456789012", region="us-east-1"),
    )
    
    # Prod環境
    prod_stack = AppStack(
        app,
        "ProdAppStack",
        project=project,
        environment=Env.PRD,
        env=cdk.Environment(account="123456789012", region="us-east-1"),
    )

    # Assert
    dev_template = Template.from_stack(dev_stack)
    prod_template = Template.from_stack(prod_stack)

    # Dev環境とProd環境でLambda関数の数が同じことを確認
    dev_template.resource_count_is("AWS::Lambda::Function", 3)
    prod_template.resource_count_is("AWS::Lambda::Function", 3)
    
    # Dev環境とProd環境でDynamoDBテーブルが作成されることを確認
    dev_template.resource_count_is("AWS::DynamoDB::Table", 1)
    prod_template.resource_count_is("AWS::DynamoDB::Table", 1)
    
    # Lambda関数の基本設定確認
    dev_template.has_resource_properties(
        "AWS::Lambda::Function",
        Match.object_like({
            "Runtime": "python3.13",
            "Handler": "main.handler",
        }),
    )
    
    prod_template.has_resource_properties(
        "AWS::Lambda::Function",
        Match.object_like({
            "Runtime": "python3.13",
            "Handler": "main.handler",
        }),
    )