"""Pytest configuration and shared fixtures"""

import json
import os
from pathlib import Path

import pytest


@pytest.fixture
def sample_video_data():
    """Sample video data for testing"""
    return [
        {
            "video_id": "abc123def456",
            "title": "【ゲーム実況】ホラーゲームやってみた #1",
            "published_at": "2023-06-15T10:30:00Z",
            "tags": ["ゲーム実況", "ホラー", "Cry of Fear"],
        },
        {
            "video_id": "xyz789uvw012",
            "title": "雑談配信 - みんなと話そう！",
            "published_at": "2023-07-20T18:00:00Z",
            "tags": ["雑談", "コミュニケーション"],
        },
        {
            "video_id": "qrs345tuv678",
            "title": "歌ってみた - オリジナル曲",
            "published_at": "2023-08-10T14:45:00Z",
            "tags": ["歌ってみた", "オリジナル"],
        },
    ]


@pytest.fixture
def create_test_json_files(tmp_path, sample_video_data):
    """Create test JSON files in a temporary directory"""
    metadata_dir = tmp_path / "metadata"
    metadata_dir.mkdir()

    # Split sample data into multiple files
    file1_data = sample_video_data[:2]
    file2_data = sample_video_data[2:]

    file1_path = metadata_dir / "videos_2023_part1.json"
    file2_path = metadata_dir / "videos_2023_part2.json"

    file1_path.write_text(json.dumps(file1_data, ensure_ascii=False, indent=2))
    file2_path.write_text(json.dumps(file2_data, ensure_ascii=False, indent=2))

    return {
        "metadata_dir": str(metadata_dir),
        "files": [str(file1_path), str(file2_path)],
        "total_records": len(sample_video_data),
    }


@pytest.fixture
def mock_aws_credentials():
    """Mock AWS credentials for testing"""
    os.environ["AWS_ACCESS_KEY_ID"] = "test-access-key"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "test-secret-key"
    os.environ["AWS_DEFAULT_REGION"] = "ap-northeast-1"
    yield
    # Cleanup
    os.environ.pop("AWS_ACCESS_KEY_ID", None)
    os.environ.pop("AWS_SECRET_ACCESS_KEY", None)
    os.environ.pop("AWS_DEFAULT_REGION", None)


@pytest.fixture
def cloudformation_stack_response():
    """Mock CloudFormation stack response"""
    return {
        "Stacks": [
            {
                "StackName": "DevDiopsideApp",
                "StackStatus": "CREATE_COMPLETE",
                "Outputs": [
                    {
                        "OutputKey": "TableArn",
                        "OutputValue": "arn:aws:dynamodb:ap-northeast-1:123456789012:table/dev-diopside-videos",
                    },
                    {
                        "OutputKey": "ApiUrl",
                        "OutputValue": "https://api.dev.example.com",
                    },
                ],
            }
        ]
    }


@pytest.fixture
def invalid_video_data():
    """Invalid video data for error testing"""
    return [
        {
            # Missing video_id
            "title": "Missing ID Video",
            "published_at": "2023-01-01T00:00:00Z",
        },
        {
            "video_id": "valid123",
            # Missing title
            "published_at": "2023-01-01T00:00:00Z",
        },
        {
            "video_id": "invalid_date",
            "title": "Invalid Date Video",
            "published_at": "not-a-date",  # Invalid date format
        },
    ]
