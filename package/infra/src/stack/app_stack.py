from typing import Any

import aws_cdk as cdk
from constructs import Construct
from src.construct.backend import BackendApiConstruct
from src.construct.frontend import FrontEndConstruct
from src.model.env import Env
from src.model.project import Project


class AppStack(cdk.Stack):
    """Unified Application Stack with both Backend and Frontend resources."""

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
            description=f"{project.description} - Unified Application Stack",
            **kwargs,
        )

        # バックエンドAPI構築
        self.backend = BackendApiConstruct(
            self,
            "BackendApi",
            environment=environment,
            project=project,
        )

        # フロントエンド構築（API URLを直接渡す - クロススタック参照不要）
        self.frontend = FrontEndConstruct(
            self,
            "Frontend",
            environment=environment,
            api_url=self.backend.api.api_gateway.url,
        )

        # 出力
        cdk.CfnOutput(
            self,
            "ApiGatewayUrl",
            value=self.backend.api.api_gateway.url,
            description="API Gateway URL",
        )

        cdk.CfnOutput(
            self,
            "FrontendUrl",
            value=f"https://{self.frontend.static_distribution.domain_name}",
            description="Frontend CloudFront URL",
        )

        cdk.CfnOutput(
            self,
            "DynamoDBTableName",
            value=self.backend.archive_metadata.table.table_name,
            description="DynamoDB table name",
        )
