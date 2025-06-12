"""Storage constructs for S3 and DynamoDB."""

from typing import Any, Self

import aws_cdk as cdk
from aws_cdk import aws_dynamodb as dynamodb, aws_s3 as s3
from construct import Construct


class S3Construct(Construct):
    """S3 bucket construct for static hosting and thumbnails."""

    def __init__(
        self: Self,
        scope: Construct,
        construct_id: str,
        environment: str,
        **kwargs: Any,  # noqa: ANN401
    ) -> None:
        """Initialize S3 construct.

        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            environment: Environment name (dev/prod)
            **kwargs: Additional keyword arguments
        """
        super().__init__(scope, construct_id, **kwargs)

        self.env_name = environment

        # Create S3 bucket
        self.bucket = s3.Bucket(
            self,
            "Bucket",
            bucket_name=f"shirayuki-tomo-fansite-{self.env_name}-{cdk.Aws.ACCOUNT_ID}",
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            encryption=s3.BucketEncryption.S3_MANAGED,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    enabled=True,
                    noncurrent_version_expiration=cdk.Duration.days(30),
                ),
            ],
            removal_policy=cdk.RemovalPolicy.DESTROY
            if environment == "dev"
            else cdk.RemovalPolicy.RETAIN,
            auto_delete_objects=environment == "dev",
        )

        # Output bucket name
        cdk.CfnOutput(
            self,
            "BucketName",
            value=self.bucket.bucket_name,
            description=f"S3 bucket name for {self.env_name} environment",
        )


class DynamoDBConstruct(Construct):
    """DynamoDB table construct for archive metadata."""

    def __init__(
        self: Self,
        scope: Construct,
        construct_id: str,
        environment: str,
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

        self.env_name = environment

        # Create DynamoDB table
        self.table = dynamodb.Table(
            self,
            "Table",
            table_name=f"ArchiveMetadata-{self.env_name}",
            partition_key=dynamodb.Attribute(
                name="PK",
                type=dynamodb.AttributeType.STRING,
            ),
            sort_key=dynamodb.Attribute(
                name="SK",
                type=dynamodb.AttributeType.STRING,
            ),
            billing_mode=dynamodb.BillingMode.ON_DEMAND,
            point_in_time_recovery=environment == "prod",
            removal_policy=cdk.RemovalPolicy.DESTROY
            if environment == "dev"
            else cdk.RemovalPolicy.RETAIN,
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

        # Output table name
        cdk.CfnOutput(
            self,
            "TableName",
            value=self.table.table_name,
            description=f"DynamoDB table name for {self.env_name} environment",
        )
