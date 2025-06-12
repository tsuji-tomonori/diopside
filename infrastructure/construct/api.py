"""API Gateway construct."""

from typing import Any, Self

import aws_cdk as cdk
from aws_cdk import (
    aws_apigatewayv2 as apigwv2,
    aws_apigatewayv2_integrations as apigwv2_integrations,
)
from aws_cdk import aws_lambda as lambda_, aws_logs as logs
from construct import Construct


class ApiGatewayConstruct(Construct):
    """API Gateway construct for HTTP API."""

    def __init__(
        self: Self,
        scope: Construct,
        construct_id: str,
        environment: str,
        lambda_function: lambda_.Function,
        **kwargs: Any,  # noqa: ANN401
    ) -> None:
        """Initialize API Gateway construct.

        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            environment: Environment name (dev/prod)
            lambda_function: Lambda function to integrate with
            **kwargs: Additional keyword arguments
        """
        super().__init__(scope, construct_id, **kwargs)

        self.env_name = environment

        # Create HTTP API
        self.api = apigwv2.HttpApi(
            self,
            "HttpApi",
            api_name=f"shirayuki-tomo-fansite-api-{self.env_name}",
            description=f"Shirayuki Tomo fansite API - {self.env_name}",
            cors_preflight=apigwv2.CorsPreflightOptions(
                allow_origins=["*"],
                allow_methods=[apigwv2.CorsHttpMethod.ANY],
                allow_headers=["*"],
            ),
        )

        # Create Lambda integration
        lambda_integration = apigwv2_integrations.HttpLambdaIntegration(
            "LambdaIntegration",
            lambda_function,
        )

        # Add routes
        self.api.add_routes(
            path="/{proxy+}",
            methods=[apigwv2.HttpMethod.ANY],
            integration=lambda_integration,
        )

        # Add root route
        self.api.add_routes(
            path="/",
            methods=[apigwv2.HttpMethod.ANY],
            integration=lambda_integration,
        )

        # Create access logs
        self.access_log_group = logs.LogGroup(
            self,
            "AccessLogGroup",
            log_group_name=f"/aws/apigateway/shirayuki-tomo-fansite-api-{self.env_name}",
            retention=logs.RetentionDays.ONE_MONTH
            if environment == "dev"
            else logs.RetentionDays.THREE_MONTHS,
            removal_policy=cdk.RemovalPolicy.DESTROY,
        )

        # Create stage with logging
        self.stage = apigwv2.HttpStage(
            self,
            "Stage",
            http_api=self.api,
            stage_name="$default",
            auto_deploy=True,
            access_log_destination=apigwv2.HttpStageAttributes(
                stage_name="$default",
            ),
        )

        # Output API endpoint
        cdk.CfnOutput(
            self,
            "ApiEndpoint",
            value=self.api.api_endpoint,
            description=f"API Gateway endpoint for {self.env_name} environment",
        )
