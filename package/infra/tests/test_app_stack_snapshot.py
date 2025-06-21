"""AppStack のスナップショットテスト"""

import aws_cdk as cdk
from aws_cdk.assertions import Template
from src.model.env import Env
from src.model.project import Project
from src.stack.app_stack import AppStack


def test_app_stack_snapshot() -> None:
    """AppStackのスナップショットテスト"""
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

    # Assert
    template = Template.from_stack(stack)

    # スナップショットを生成（初回実行時に作成される）
    assert template.to_json() is not None

    # 主要なリソースが存在することを確認
    template.resource_count_is("AWS::DynamoDB::Table", 1)
    template.resource_count_is("AWS::Lambda::Function", 3)  # メイン + S3デプロイメント用カスタムリソース2つ
    template.resource_count_is("AWS::ApiGateway::RestApi", 1)
    template.resource_count_is("AWS::S3::Bucket", 1)
    template.resource_count_is("AWS::CloudFront::Distribution", 1)


def test_app_stack_outputs() -> None:
    """AppStackの出力値をテスト"""
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

    # Assert
    template = Template.from_stack(stack)

    # 出力値の存在を確認
    outputs = template.find_outputs("*")
    output_keys = list(outputs.keys())

    assert "ApiGatewayUrl" in output_keys
    assert "FrontendUrl" in output_keys
    assert "DynamoDBTableName" in output_keys
