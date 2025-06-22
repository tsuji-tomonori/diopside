from typing import Any, Self

from constructs import Construct

from src.construct.resource.function import LambdaConstruct
from src.construct.resource.rest_api import ApigwConstruct
from src.construct.resource.table import DynamoDBConstruct
from src.construct.resource.waf import WafConstruct
from src.model.env import Env
from src.model.project import Project


class BackendApiConstruct(Construct):
    """Backend API construct for FastAPI backend."""

    def __init__(
        self: Self,
        scope: Construct,
        construct_id: str,
        environment: Env,
        project: Project,
        **kwargs: Any,  # noqa: ANN401
    ) -> None:
        """Initialize Backend API construct.

        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            environment: Environment name (dev/prod)
            **kwargs: Additional keyword arguments
        """
        super().__init__(scope, construct_id, **kwargs)

        self.env = environment

        self.server = LambdaConstruct(
            self,
            "Server",
            environment=environment,
            project=project,
        )

        self.archive_metadata = DynamoDBConstruct(
            self,
            "ArchiveMetadata",
            environment=environment,
        )

        self.server.function.add_environment(
            "DYNAMODB_TABLE_NAME",
            self.archive_metadata.table.table_name,
        )

        assert self.server.function.role is not None, (
            "Lambda function role must be defined"
        )
        self.archive_metadata.table.grant_read_data(self.server.function)

        self.waf = WafConstruct(
            self,
            "ApiWaf",
            environment=environment,
            web_acl_scope="REGIONAL",
        )

        self.api = ApigwConstruct(
            self,
            "Api",
            environment=environment,
            project=project,
            web_acl_arn=self.waf.web_acl_arn,  # type: ignore
            function=self.server.function,
        )
