from typing import Any

import aws_cdk as cdk
from constructs import Construct
from src.construct.backend import BackendApiConstruct
from src.construct.frontend import FrontEndStack
from src.model.env import Env
from src.model.project import Project


class AppStack(cdk.Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        project: Project,
        environment: Env,
        # web_acl_arn: str,
        **kwargs: Any,  # noqa: ANN401
    ) -> None:
        super().__init__(
            scope,
            construct_id,
            description=project.description,
            **kwargs,
        )

        self.backend = BackendApiConstruct(
            self,
            "BackendApi",
            environment=environment,
            project=project,
        )

        self.frontend = FrontEndStack(
            self,
            "FrontEnd",
            environment=environment,
            # web_acl_arn=web_acl_arn,
        )
