"""Tests for CloudFormationHelper class"""

from unittest.mock import Mock, patch

import pytest
from botocore.exceptions import ClientError

from src.import_json_to_dynamodb import CloudFormationHelper


class TestCloudFormationHelper:
    """CloudFormationHelper class tests"""

    @pytest.fixture
    def mock_cf_client(self):
        """Mock CloudFormation client"""
        with patch("boto3.client") as mock_client:
            yield mock_client.return_value

    @pytest.fixture
    def helper(self, mock_cf_client):
        """Create CloudFormationHelper instance"""
        return CloudFormationHelper()

    def test_init(self, mock_cf_client):
        """Test CloudFormationHelper initialization"""
        helper = CloudFormationHelper(region="us-west-2")
        assert helper.cf_client is not None

    def test_get_stack_outputs_success(self, helper, mock_cf_client):
        """Test successful stack outputs retrieval"""
        # Mock CloudFormation response
        mock_response = {
            "Stacks": [
                {
                    "Outputs": [
                        {
                            "OutputKey": "TableArn",
                            "OutputValue": "arn:aws:dynamodb:region:account:table/test-table",
                        },
                        {
                            "OutputKey": "ApiUrl",
                            "OutputValue": "https://api.example.com",
                        },
                    ]
                }
            ]
        }
        helper.cf_client.describe_stacks.return_value = mock_response

        # Execute
        outputs = helper.get_stack_outputs("test-stack")

        # Assert
        assert outputs == {
            "TableArn": "arn:aws:dynamodb:region:account:table/test-table",
            "ApiUrl": "https://api.example.com",
        }
        helper.cf_client.describe_stacks.assert_called_once_with(StackName="test-stack")

    def test_get_stack_outputs_no_stack(self, helper, mock_cf_client):
        """Test handling when stack not found"""
        mock_response = {"Stacks": []}
        helper.cf_client.describe_stacks.return_value = mock_response

        with pytest.raises(ValueError, match="Stack test-stack not found"):
            helper.get_stack_outputs("test-stack")

    def test_get_stack_outputs_client_error(self, helper, mock_cf_client):
        """Test handling of CloudFormation client error"""
        helper.cf_client.describe_stacks.side_effect = ClientError(
            {"Error": {"Code": "ValidationError", "Message": "Stack does not exist"}},
            "describe_stacks",
        )

        with pytest.raises(RuntimeError, match="Failed to get stack outputs"):
            helper.get_stack_outputs("test-stack")

    def test_get_stack_outputs_no_outputs(self, helper, mock_cf_client):
        """Test handling stack with no outputs"""
        mock_response = {"Stacks": [{}]}
        helper.cf_client.describe_stacks.return_value = mock_response

        outputs = helper.get_stack_outputs("test-stack")
        assert outputs == {}

    def test_get_table_name_from_arn(self, helper):
        """Test extracting table name from ARN"""
        arn = "arn:aws:dynamodb:ap-northeast-1:123456789012:table/my-table"
        table_name = helper.get_table_name_from_arn(arn)
        assert table_name == "my-table"

    def test_get_table_name_from_arn_with_slash(self, helper):
        """Test extracting table name from ARN with slash in name"""
        arn = "arn:aws:dynamodb:region:account:table/dev/my-table"
        table_name = helper.get_table_name_from_arn(arn)
        assert table_name == "my-table"

    def test_get_dynamodb_table_name_success(self, helper, mock_cf_client):
        """Test successful DynamoDB table name retrieval"""
        mock_response = {
            "Stacks": [
                {
                    "Outputs": [
                        {
                            "OutputKey": "TableArn",
                            "OutputValue": "arn:aws:dynamodb:region:account:table/test-table",
                        }
                    ]
                }
            ]
        }
        helper.cf_client.describe_stacks.return_value = mock_response

        table_name = helper.get_dynamodb_table_name("test-stack")
        assert table_name == "test-table"

    def test_get_dynamodb_table_name_alternative_key(self, helper, mock_cf_client):
        """Test DynamoDB table name retrieval with alternative output key"""
        mock_response = {
            "Stacks": [
                {
                    "Outputs": [
                        {
                            "OutputKey": "DynamoTableArn",
                            "OutputValue": "arn:aws:dynamodb:region:account:table/alt-table",
                        }
                    ]
                }
            ]
        }
        helper.cf_client.describe_stacks.return_value = mock_response

        table_name = helper.get_dynamodb_table_name("test-stack")
        assert table_name == "alt-table"

    def test_get_dynamodb_table_name_no_table_arn(self, helper, mock_cf_client):
        """Test handling when TableArn not found in outputs"""
        mock_response = {
            "Stacks": [
                {
                    "Outputs": [
                        {
                            "OutputKey": "ApiUrl",
                            "OutputValue": "https://api.example.com",
                        }
                    ]
                }
            ]
        }
        helper.cf_client.describe_stacks.return_value = mock_response

        with pytest.raises(
            ValueError, match="TableArn not found in stack test-stack outputs"
        ):
            helper.get_dynamodb_table_name("test-stack")
