from typing import Any, Self

import aws_cdk as cdk
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_s3 as s3
from constructs import Construct
from src.model.env import Env


class DynamoDBConstruct(Construct):
    """DynamoDB table construct for archive metadata."""

    def __init__(
        self: Self,
        scope: Construct,
        construct_id: str,
        environment: Env,
        **kwargs: Any,  # noqa: ANN401
    ) -> None:
        """Initialize DynamoDB construct.

        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            environment: Environment name (dev/prod)
            **kwargs: Additional keyword arguments
        """
        super().__init__(scope, construct_id, **kwargs)

        self.env = environment

        # Create DynamoDB table
        self.table = dynamodb.Table(
            self,
            "Table",
            partition_key=dynamodb.Attribute(
                name="PK",
                type=dynamodb.AttributeType.STRING,
            ),
            sort_key=dynamodb.Attribute(
                name="SK",
                type=dynamodb.AttributeType.STRING,
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=environment.removal_policy(),
        )

        # Add GSI for tag-based queries
        self.table.add_global_secondary_index(
            index_name="ByTag",
            partition_key=dynamodb.Attribute(
                name="Tag",
                type=dynamodb.AttributeType.STRING,
            ),
            sort_key=dynamodb.Attribute(
                name="SK",
                type=dynamodb.AttributeType.STRING,
            ),
        )

        # Add GSI1 for year-based queries
        self.table.add_global_secondary_index(
            index_name="GSI1",
            partition_key=dynamodb.Attribute(
                name="year",
                type=dynamodb.AttributeType.NUMBER,
            ),
            sort_key=dynamodb.Attribute(
                name="SK",
                type=dynamodb.AttributeType.STRING,
            ),
        )

        # Output table name
        cdk.CfnOutput(
            self,
            "TableArn",
            value=self.table.table_arn,
            description=f"DynamoDB table ARN for {self.env} environment",
        )
