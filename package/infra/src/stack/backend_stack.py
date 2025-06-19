from typing import Any

import aws_cdk as cdk
from constructs import Construct
from src.construct.backend import BackendApiConstruct
from src.model.env import Env
from src.model.project import Project


class BackendStack(cdk.Stack):
    """Backend API Stack with API Gateway and Lambda."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        project: Project,
        environment: Env,
        **kwargs: Any,  # noqa: ANN401
    ) -> None:
        super().__init__(
            scope,
            construct_id,
            description=f"{project.description} - Backend API",
            **kwargs,
        )

        # バックエンドAPI構築
        self.backend = BackendApiConstruct(
            self,
            "BackendApi",
            environment=environment,
            project=project,
        )

        # API URLをクロススタック参照用にエクスポート
        self.api_url_output = cdk.CfnOutput(
            self,
            "ApiGatewayUrl",
            value=self.backend.api.api_gateway.url,
            description="API Gateway URL for cross-stack reference",
            export_name=f"{environment.name}-{project.name}-api-url",
        )

        # API Gateway IDもエクスポート（必要に応じて）
        self.api_id_output = cdk.CfnOutput(
            self,
            "ApiGatewayId",
            value=self.backend.api.api_gateway.rest_api_id,
            description="API Gateway ID for cross-stack reference",
            export_name=f"{environment.name}-{project.name}-api-id",
        )

        # DynamoDB テーブル名もエクスポート（必要に応じて）
        self.table_name_output = cdk.CfnOutput(
            self,
            "DynamoDBTableName",
            value=self.backend.archive_metadata.table.table_name,
            description="DynamoDB table name for cross-stack reference",
            export_name=f"{environment.name}-{project.name}-table-name",
        )
