"""Lambda function construct."""

from pathlib import Path
from typing import Any, Self

import aws_cdk as cdk
from aws_cdk import aws_iam as iam, aws_lambda as lambda_, aws_logs as logs
from construct import Construct


class LambdaConstruct(Construct):
    """Lambda function construct for FastAPI backend."""

    def __init__(
        self: Self,
        scope: Construct,
        construct_id: str,
        environment: str,
        **kwargs: Any,  # noqa: ANN401
    ) -> None:
        """Initialize Lambda construct.

        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            environment: Environment name (dev/prod)
            **kwargs: Additional keyword arguments
        """
        super().__init__(scope, construct_id, **kwargs)

        self.env_name = environment

        # Create Lambda function
        self.function = lambda_.Function(
            self,
            "Function",
            function_name=f"ShirayukiTomoFansite-{self.env_name}-FastAPIFunction",
            runtime=lambda_.Runtime.PYTHON_3_13,
            handler="main.handler",
            code=lambda_.Code.from_asset(str(Path("../backend").resolve())),
            memory_size=128,
            timeout=cdk.Duration.seconds(30),
            logging_format=lambda_.LoggingFormat.JSON,
            system_log_level_v2=lambda_.SystemLogLevel.INFO,
            application_log_level_v2=lambda_.ApplicationLogLevel.INFO,
            tracing=lambda_.Tracing.ACTIVE,
            environment={
                "ENVIRONMENT": self.env_name,
            },
        )

        # Create log group with retention
        self.log_group = logs.LogGroup(
            self,
            "LogGroup",
            log_group_name=f"/aws/lambda/{self.function.function_name}",
            retention=logs.RetentionDays.ONE_MONTH
            if environment == "dev"
            else logs.RetentionDays.THREE_MONTHS,
            removal_policy=cdk.RemovalPolicy.DESTROY,
        )

        # Output function ARN
        cdk.CfnOutput(
            self,
            "FunctionArn",
            value=self.function.function_arn,
            description=f"Lambda function ARN for {self.env_name} environment",
        )

    def add_environment_variable(self: Self, key: str, value: str) -> None:
        """Add environment variable to the Lambda function.

        Args:
            key: Environment variable key
            value: Environment variable value
        """
        self.function.add_environment(key, value)

    def grant_dynamodb_access(self: Self, table_arn: str) -> None:
        """Grant DynamoDB access to the Lambda function.

        Args:
            table_arn: DynamoDB table ARN
        """
        if self.function.role:
            self.function.role.add_to_policy(
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem",
                        "dynamodb:Query",
                        "dynamodb:Scan",
                    ],
                    resources=[table_arn, f"{table_arn}/index/*"],
                )
            )

    def grant_s3_access(self: Self, bucket_arn: str) -> None:
        """Grant S3 access to the Lambda function.

        Args:
            bucket_arn: S3 bucket ARN
        """
        if self.function.role:
            self.function.role.add_to_policy(
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject",
                    ],
                    resources=[f"{bucket_arn}/*"],
                )
            )
