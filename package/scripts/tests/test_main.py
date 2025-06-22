"""Integration tests for the main function"""

import sys
from unittest.mock import MagicMock, Mock, patch

import pytest

from src.import_json_to_dynamodb import main


class TestMain:
    """Main function integration tests"""

    @pytest.fixture
    def mock_cloudformation_helper(self):
        """Mock CloudFormationHelper"""
        with patch("src.import_json_to_dynamodb.CloudFormationHelper") as mock_class:
            mock_instance = Mock()
            mock_instance.get_dynamodb_table_name.return_value = "test-table"
            mock_class.return_value = mock_instance
            yield mock_instance

    @pytest.fixture
    def mock_importer(self):
        """Mock JsonToDynamoDBImporter"""
        with patch("src.import_json_to_dynamodb.JsonToDynamoDBImporter") as mock_class:
            mock_instance = Mock()
            mock_instance.import_all_files.return_value = {
                "total_files": 2,
                "total_imported": 10,
                "results": [
                    {
                        "file": "file1.json",
                        "success": True,
                        "imported_count": 5,
                        "error": None,
                    },
                    {
                        "file": "file2.json",
                        "success": True,
                        "imported_count": 5,
                        "error": None,
                    },
                ],
            }
            mock_class.return_value = mock_instance
            yield mock_instance

    def test_main_default_args(self, mock_cloudformation_helper, mock_importer):
        """Test main function with default arguments"""
        with patch("sys.argv", ["script.py"]):
            exit_code = main()

        assert exit_code == 0
        mock_cloudformation_helper.get_dynamodb_table_name.assert_called_once_with(
            "DevDiopsideApp"
        )
        mock_importer.import_all_files.assert_called_once_with("metadata")

    def test_main_custom_args(self, mock_cloudformation_helper, mock_importer):
        """Test main function with custom arguments"""
        with patch(
            "sys.argv",
            [
                "script.py",
                "--stack-name",
                "ProdStack",
                "--region",
                "us-west-2",
                "--metadata-dir",
                "custom/metadata",
            ],
        ):
            exit_code = main()

        assert exit_code == 0
        mock_cloudformation_helper.get_dynamodb_table_name.assert_called_once_with(
            "ProdStack"
        )
        mock_importer.import_all_files.assert_called_once_with("custom/metadata")

    def test_main_with_import_errors(self, mock_cloudformation_helper, mock_importer):
        """Test main function handling import errors"""
        mock_importer.import_all_files.return_value = {
            "total_files": 3,
            "total_imported": 5,
            "error": "Some files could not be processed",
            "results": [
                {
                    "file": "file1.json",
                    "success": True,
                    "imported_count": 5,
                    "error": None,
                },
                {
                    "file": "file2.json",
                    "success": False,
                    "imported_count": 0,
                    "error": "Invalid JSON",
                },
                {
                    "file": "file3.json",
                    "success": False,
                    "imported_count": 0,
                    "error": "File not found",
                },
            ],
        }

        with patch("sys.argv", ["script.py"]):
            exit_code = main()

        assert exit_code == 0  # Still succeeds even with partial failures

    def test_main_cloudformation_error(self, mock_cloudformation_helper):
        """Test main function handling CloudFormation errors"""
        mock_cloudformation_helper.get_dynamodb_table_name.side_effect = RuntimeError(
            "Stack not found"
        )

        with patch("sys.argv", ["script.py"]):
            exit_code = main()

        assert exit_code == 1

    def test_main_importer_error(self, mock_cloudformation_helper, mock_importer):
        """Test main function handling importer initialization error"""
        with patch("src.import_json_to_dynamodb.JsonToDynamoDBImporter") as mock_class:
            mock_class.side_effect = Exception("Failed to create importer")

            with patch("sys.argv", ["script.py"]):
                exit_code = main()

        assert exit_code == 1

    def test_main_no_files_found(self, mock_cloudformation_helper, mock_importer):
        """Test main function when no files are found"""
        mock_importer.import_all_files.return_value = {
            "total_files": 0,
            "total_imported": 0,
            "results": [],
            "error": "No JSON files found in metadata",
        }

        with patch("sys.argv", ["script.py"]):
            exit_code = main()

        assert exit_code == 0

    @patch("builtins.print")
    def test_main_output_format(
        self, mock_print, mock_cloudformation_helper, mock_importer
    ):
        """Test that main function prints expected output"""
        with patch("sys.argv", ["script.py"]):
            main()

        # Verify key output messages
        print_calls = [call[0][0] for call in mock_print.call_args_list]

        assert any("Resolving DynamoDB table name" in call for call in print_calls)
        assert any("Found DynamoDB table: test-table" in call for call in print_calls)
        assert any("IMPORT COMPLETED" in call for call in print_calls)
        assert any("Total files processed: 2" in call for call in print_calls)
        assert any("Total records imported: 10" in call for call in print_calls)
        assert any("✓ file1.json: 5 records" in call for call in print_calls)

    def test_main_help_argument(self):
        """Test main function with --help argument"""
        with patch("sys.argv", ["script.py", "--help"]):
            with pytest.raises(SystemExit) as exc_info:
                main()
            assert exc_info.value.code == 0
