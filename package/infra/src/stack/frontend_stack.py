from typing import Any

import aws_cdk as cdk
from constructs import Construct
from src.construct.frontend import FrontEndConstruct
from src.model.env import Env
from src.model.project import Project


class FrontendStack(cdk.Stack):
    """Frontend Stack with CloudFront and S3."""

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
            description=f"{project.description} - Frontend",
            **kwargs,
        )

        # バックエンドスタックからAPI URLをインポート
        api_url = cdk.Fn.import_value(f"{environment.name}-{project.name}-api-url")

        # フロントエンド構築（API URLを渡す）
        self.frontend = FrontEndConstruct(
            self,
            "Frontend",
            environment=environment,
            api_url=api_url,
        )

        # フロントエンドのCloudFront URLを出力
        cdk.CfnOutput(
            self,
            "FrontendUrl",
            value=f"https://{self.frontend.static_distribution.domain_name}",
            description="Frontend CloudFront URL",
        )
