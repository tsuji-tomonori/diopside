from typing import Any, Self

import aws_cdk as cdk
from aws_cdk import aws_apigateway as apigw
from aws_cdk import aws_lambda as lambda_
from aws_cdk import aws_wafv2 as wafv2
from constructs import Construct
from src.model.env import Env
from src.model.project import Project


class ApigwConstruct(Construct):
    """API Gateway construct for FastAPI backend."""

    def __init__(
        self: Self,
        scope: Construct,
        construct_id: str,
        environment: Env,
        project: Project,
        web_acl_arn: str,
        function: lambda_.IFunction,
        **kwargs: Any,  # noqa: ANN401
    ) -> None:
        """Initialize API Gateway construct.

        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            environment: Environment name (dev/prod)
            **kwargs: Additional keyword arguments
        """
        super().__init__(scope, construct_id, **kwargs)

        self.env = environment

        # Create API Gateway
        self.api_gateway = apigw.LambdaRestApi(
            self,
            "LambdaRestApi",
            handler=function,
            proxy=True,
            description=project.description,
            deploy_options=apigw.StageOptions(
                logging_level=apigw.MethodLoggingLevel.ERROR,
                stage_name=project.major_version,
            ),
        )

        self.waf_connection = wafv2.CfnWebACLAssociation(
            scope=self,
            id="WebAclAssociation",
            resource_arn=(
                f"arn:aws:apigateway:{self.api_gateway.env.region}::"
                f"/restapis/{self.api_gateway.rest_api_id}"
                f"/stages/{self.api_gateway.deployment_stage.stage_name}"
            ),
            web_acl_arn=web_acl_arn,
        )

        # APIのメソッドが作成された後でしか設定できないため
        self.waf_connection.add_dependency(
            target=self.api_gateway.deployment_stage.node.default_child,  # type: ignore  # noqa: PGH003, E501
        )

        # Output API Gateway URL
        cdk.CfnOutput(
            self,
            "ApiGatewayUrl",
            value=self.api_gateway.url,
            description=f"API Gateway URL for {self.env} environment",
        )

        cdk.CfnOutput(
            self,
            "ApigwLogGroupName",
            value=f"API-Gateway-Execution-Logs_{self.api_gateway.rest_api_id}/{self.api_gateway.deployment_stage.stage_name}",
            description=f"API Gateway log group name for {self.env} environment",
        )
