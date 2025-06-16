from typing import Any

import aws_cdk as cdk
from constructs import Construct
from src.construct.resource.waf import WafConstruct
from src.model.env import Env
from src.model.project import Project


class FrontEndWafStack(cdk.Stack):
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
            description=project.description,
            **kwargs,
        )

        self.waf = WafConstruct(
            self,
            "FrontendWaf",
            environment=environment,
            web_acl_scope="CLOUDFRONT",
        )
