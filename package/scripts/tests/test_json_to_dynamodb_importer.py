"""Tests for JsonToDynamoDBImporter class"""

import json
from unittest.mock import MagicMock, Mock, patch

import pytest

from src.import_json_to_dynamodb import JsonToDynamoDBImporter


class TestJsonToDynamoDBImporter:
    """JsonToDynamoDBImporter class tests"""

    @pytest.fixture
    def mock_dynamodb_table(self):
        """Mock DynamoDB table"""
        with patch("boto3.resource") as mock_resource:
            mock_table = Mock()
            mock_resource.return_value.Table.return_value = mock_table
            yield mock_table

    @pytest.fixture
    def importer(self, mock_dynamodb_table):
        """Create JsonToDynamoDBImporter instance"""
        return JsonToDynamoDBImporter("test-table")

    def test_init(self, mock_dynamodb_table):
        """Test JsonToDynamoDBImporter initialization"""
        importer = JsonToDynamoDBImporter("test-table", region="us-west-2")
        assert importer.table_name == "test-table"
        assert importer.table is not None

    def test_scan_json_files(self, importer, tmp_path):
        """Test scanning JSON files in directory"""
        # Create test files
        metadata_dir = tmp_path / "metadata"
        metadata_dir.mkdir()
        (metadata_dir / "file1.json").write_text("{}")
        (metadata_dir / "file2.json").write_text("{}")
        (metadata_dir / "file3.txt").write_text("not json")

        with patch("glob.glob") as mock_glob:
            mock_glob.return_value = [
                str(metadata_dir / "file1.json"),
                str(metadata_dir / "file2.json"),
            ]
            files = importer.scan_json_files(str(metadata_dir))

        assert len(files) == 2
        assert all(f.endswith(".json") for f in files)

    def test_load_json_data_success(self, importer, tmp_path):
        """Test successful JSON data loading"""
        test_data = [{"video_id": "test123", "title": "Test Video"}]
        json_file = tmp_path / "test.json"
        json_file.write_text(json.dumps(test_data))

        data = importer.load_json_data(str(json_file))
        assert data == test_data

    def test_load_json_data_invalid_json(self, importer, tmp_path):
        """Test handling of invalid JSON"""
        json_file = tmp_path / "invalid.json"
        json_file.write_text("invalid json {")

        with pytest.raises(ValueError, match="Invalid JSON in file"):
            importer.load_json_data(str(json_file))

    def test_load_json_data_file_not_found(self, importer):
        """Test handling of non-existent file"""
        with pytest.raises(FileNotFoundError, match="File not found"):
            importer.load_json_data("/non/existent/file.json")

    def test_extract_year_from_published_at(self, importer):
        """Test year extraction from various date formats"""
        # Test ISO format
        assert importer.extract_year_from_published_at("2023-01-15T10:30:00Z") == 2023
        assert (
            importer.extract_year_from_published_at("2022-12-31T23:59:59+09:00") == 2022
        )

        # Test different ISO variations
        assert importer.extract_year_from_published_at("2021-06-01") == 2021

    def test_extract_year_from_published_at_invalid(self, importer):
        """Test handling of invalid date formats"""
        with pytest.raises(ValueError, match="Invalid published_at format"):
            importer.extract_year_from_published_at("invalid-date")

        with pytest.raises(ValueError, match="Invalid published_at format"):
            importer.extract_year_from_published_at(None)

    def test_generate_thumbnail_url(self, importer):
        """Test YouTube thumbnail URL generation"""
        video_id = "dQw4w9WgXcQ"
        expected_url = "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
        assert importer.generate_thumbnail_url(video_id) == expected_url

    def test_transform_to_dynamodb_record(self, importer):
        """Test transformation of JSON record to DynamoDB format"""
        json_record = {
            "video_id": "test123",
            "title": "Test Video Title",
            "published_at": "2023-06-15T10:30:00Z",
            "tags": ["tag1", "tag2", "tag3"],
        }

        with patch("src.import_json_to_dynamodb.datetime") as mock_datetime:
            mock_datetime.utcnow.return_value.isoformat.return_value = (
                "2024-01-01T00:00:00"
            )
            record = importer.transform_to_dynamodb_record(json_record)

        assert record["PK"] == "YEAR#2023"
        assert record["SK"] == "VIDEO#test123"
        assert record["video_id"] == "test123"
        assert record["title"] == "Test Video Title"
        assert record["tags"] == ["tag1", "tag2", "tag3"]
        assert record["year"] == 2023
        assert (
            record["thumbnail_url"]
            == "https://img.youtube.com/vi/test123/maxresdefault.jpg"
        )
        assert record["created_at"] == "2023-06-15T10:30:00Z"
        assert record["updated_at"] == "2024-01-01T00:00:00Z"
        assert record["Tag"] == "tag1"  # First tag for GSI

    def test_transform_to_dynamodb_record_no_tags(self, importer):
        """Test transformation without tags"""
        json_record = {
            "video_id": "test456",
            "title": "No Tags Video",
            "published_at": "2023-01-01T00:00:00Z",
        }

        record = importer.transform_to_dynamodb_record(json_record)
        assert record["tags"] == []
        assert "Tag" not in record

    def test_batch_write_records(self, importer, mock_dynamodb_table):
        """Test batch writing records to DynamoDB"""
        # Create mock batch writer as a context manager
        mock_batch_writer = MagicMock()
        mock_context_manager = MagicMock()
        mock_context_manager.__enter__.return_value = mock_batch_writer
        mock_dynamodb_table.batch_writer.return_value = mock_context_manager

        # Test with 30 records (should be split into 2 batches)
        records = [{"PK": "YEAR#2023", "SK": f"VIDEO#{i}"} for i in range(30)]

        importer.batch_write_records(records)

        # Verify batch_writer was used
        assert mock_dynamodb_table.batch_writer.call_count == 2
        # Verify all records were written
        assert mock_batch_writer.put_item.call_count == 30

    def test_import_file_success(self, importer, tmp_path, mock_dynamodb_table):
        """Test successful file import"""
        test_data = [
            {
                "video_id": "video1",
                "title": "Video 1",
                "published_at": "2023-01-01T00:00:00Z",
                "tags": ["tag1"],
            },
            {
                "video_id": "video2",
                "title": "Video 2",
                "published_at": "2023-02-01T00:00:00Z",
                "tags": ["tag2"],
            },
        ]

        json_file = tmp_path / "test.json"
        json_file.write_text(json.dumps(test_data))

        # Mock batch writer as a context manager
        mock_batch_writer = MagicMock()
        mock_context_manager = MagicMock()
        mock_context_manager.__enter__.return_value = mock_batch_writer
        mock_dynamodb_table.batch_writer.return_value = mock_context_manager

        result = importer.import_file(str(json_file))

        assert result["success"] is True
        assert result["imported_count"] == 2
        assert result["error"] is None
        assert mock_batch_writer.put_item.call_count == 2

    def test_import_file_empty(self, importer, tmp_path):
        """Test importing empty file"""
        json_file = tmp_path / "empty.json"
        json_file.write_text("[]")

        result = importer.import_file(str(json_file))

        assert result["success"] is True
        assert result["imported_count"] == 0
        assert result["error"] == "Empty file"

    def test_import_file_with_invalid_records(
        self, importer, tmp_path, mock_dynamodb_table
    ):
        """Test file import with some invalid records"""
        test_data = [
            {
                "video_id": "valid1",
                "title": "Valid Video",
                "published_at": "2023-01-01T00:00:00Z",
            },
            {
                # Missing video_id
                "title": "Invalid Video",
                "published_at": "2023-01-01T00:00:00Z",
            },
            {
                "video_id": "valid2",
                "title": "Another Valid",
                "published_at": "2023-01-01T00:00:00Z",
            },
        ]

        json_file = tmp_path / "mixed.json"
        json_file.write_text(json.dumps(test_data))

        # Mock batch writer as a context manager
        mock_batch_writer = MagicMock()
        mock_context_manager = MagicMock()
        mock_context_manager.__enter__.return_value = mock_batch_writer
        mock_dynamodb_table.batch_writer.return_value = mock_context_manager

        result = importer.import_file(str(json_file))

        assert result["success"] is True
        assert result["imported_count"] == 2  # Only valid records
        assert mock_batch_writer.put_item.call_count == 2

    def test_import_file_error(self, importer):
        """Test file import error handling"""
        result = importer.import_file("/non/existent/file.json")

        assert result["success"] is False
        assert result["imported_count"] == 0
        assert "File not found" in result["error"]

    def test_import_all_files_success(self, importer, tmp_path, mock_dynamodb_table):
        """Test importing all files from directory"""
        metadata_dir = tmp_path / "metadata"
        metadata_dir.mkdir()

        # Create test files
        for i in range(3):
            test_data = [
                {
                    "video_id": f"video{i}",
                    "title": f"Video {i}",
                    "published_at": "2023-01-01T00:00:00Z",
                }
            ]
            (metadata_dir / f"file{i}.json").write_text(json.dumps(test_data))

        # Mock batch writer as a context manager
        mock_batch_writer = MagicMock()
        mock_context_manager = MagicMock()
        mock_context_manager.__enter__.return_value = mock_batch_writer
        mock_dynamodb_table.batch_writer.return_value = mock_context_manager

        with patch.object(importer, "scan_json_files") as mock_scan:
            mock_scan.return_value = [
                str(metadata_dir / f"file{i}.json") for i in range(3)
            ]
            result = importer.import_all_files(str(metadata_dir))

        assert result["total_files"] == 3
        assert result["total_imported"] == 3
        assert len(result["results"]) == 3
        assert all(r["success"] for r in result["results"])

    def test_import_all_files_no_files(self, importer):
        """Test importing from directory with no JSON files"""
        with patch.object(importer, "scan_json_files") as mock_scan:
            mock_scan.return_value = []
            result = importer.import_all_files("empty_dir")

        assert result["total_files"] == 0
        assert result["total_imported"] == 0
        assert result["results"] == []
        assert "No JSON files found" in result["error"]

    def test_import_all_files_partial_failure(
        self, importer, tmp_path, mock_dynamodb_table
    ):
        """Test importing with some file failures"""
        metadata_dir = tmp_path / "metadata"
        metadata_dir.mkdir()

        # Create valid file
        valid_data = [
            {
                "video_id": "valid",
                "title": "Valid Video",
                "published_at": "2023-01-01T00:00:00Z",
            }
        ]
        (metadata_dir / "valid.json").write_text(json.dumps(valid_data))

        # Create invalid file
        (metadata_dir / "invalid.json").write_text("invalid json")

        # Mock batch writer as a context manager
        mock_batch_writer = MagicMock()
        mock_context_manager = MagicMock()
        mock_context_manager.__enter__.return_value = mock_batch_writer
        mock_dynamodb_table.batch_writer.return_value = mock_context_manager

        with patch.object(importer, "scan_json_files") as mock_scan:
            mock_scan.return_value = [
                str(metadata_dir / "valid.json"),
                str(metadata_dir / "invalid.json"),
            ]
            result = importer.import_all_files(str(metadata_dir))

        assert result["total_files"] == 2
        assert result["total_imported"] == 1
        assert result["results"][0]["success"] is True
        assert result["results"][1]["success"] is False
