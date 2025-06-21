"""Test utilities and helpers."""

from typing import Any
from unittest.mock import MagicMock

import boto3

# Moto decorators are not used in this file, removing import
from app.models.video import Video
from app.services.dynamodb_service import DynamoDBService


def create_mock_dynamodb_table(table_name: str = "test-videos") -> Any:
    """Create a mock DynamoDB table for testing.

    Args:
        table_name: Name of the table to create

    Returns:
        The created DynamoDB table resource
    """
    dynamodb = boto3.resource("dynamodb", region_name="us-east-1")

    table = dynamodb.create_table(
        TableName=table_name,
        KeySchema=[
            {"AttributeName": "video_id", "KeyType": "HASH"},
        ],
        AttributeDefinitions=[
            {"AttributeName": "video_id", "AttributeType": "S"},
            {"AttributeName": "year", "AttributeType": "N"},
        ],
        GlobalSecondaryIndexes=[
            {
                "IndexName": "GSI1",
                "KeySchema": [
                    {"AttributeName": "year", "KeyType": "HASH"},
                    {"AttributeName": "video_id", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
                "ProvisionedThroughput": {
                    "ReadCapacityUnits": 5,
                    "WriteCapacityUnits": 5,
                },
            }
        ],
        ProvisionedThroughput={"ReadCapacityUnits": 5, "WriteCapacityUnits": 5},
    )

    # Wait for table to be created
    table.wait_until_exists()

    return table


def populate_dynamodb_table(table: Any, videos: list[Video]) -> None:
    """Populate DynamoDB table with video data.

    Args:
        table: DynamoDB table resource
        videos: List of videos to add to the table
    """
    for video in videos:
        item = {
            "video_id": video.video_id,
            "title": video.title,
            "year": video.year,
        }

        if video.tags:
            item["tags"] = video.tags
        if video.thumbnail_url:
            item["thumbnail_url"] = video.thumbnail_url
        if video.created_at:
            item["created_at"] = video.created_at

        table.put_item(Item=item)


def create_mock_db_service(
    videos: list[Video] | None = None,
    error_on_method: str | None = None,
) -> MagicMock:
    """Create a mock DynamoDB service with predefined behavior.

    Args:
        videos: List of videos to return from queries
        error_on_method: Method name that should raise an error when called

    Returns:
        Mock DynamoDB service
    """
    mock_service = MagicMock(spec=DynamoDBService)

    if error_on_method:
        # Set up error behavior
        error = RuntimeError("Mock database error")
        if error_on_method == "get_videos_by_year":
            mock_service.get_videos_by_year.side_effect = error
        elif error_on_method == "get_video_by_id":
            mock_service.get_video_by_id.side_effect = error
        elif error_on_method == "get_videos_by_tag_path":
            mock_service.get_videos_by_tag_path.side_effect = error
        elif error_on_method == "get_random_videos":
            mock_service.get_random_videos.side_effect = error
        elif error_on_method == "get_memory_thumbnails":
            mock_service.get_memory_thumbnails.side_effect = error
        elif error_on_method == "build_tag_tree":
            mock_service.build_tag_tree.side_effect = error
    else:
        # Set up normal behavior with provided videos
        videos = videos or []

        # Configure return values
        mock_service.get_videos_by_year.return_value = (videos, None)
        mock_service.get_video_by_id.return_value = videos[0] if videos else None
        mock_service.get_videos_by_tag_path.return_value = videos
        mock_service.get_random_videos.return_value = videos[:1] if videos else []

        # For memory thumbnails, create pairs
        thumbnails = []
        for video in videos[:4]:  # Use up to 4 videos
            if video.thumbnail_url:
                thumbnails.extend([video.thumbnail_url, video.thumbnail_url])
        mock_service.get_memory_thumbnails.return_value = thumbnails

        # For tag tree, create a simple structure
        mock_service.build_tag_tree.return_value = []

    return mock_service


def assert_video_equal(video1: Video, video2: Video) -> None:
    """Assert that two Video objects are equal.

    Args:
        video1: First video to compare
        video2: Second video to compare
    """
    assert video1.video_id == video2.video_id
    assert video1.title == video2.title
    assert video1.tags == video2.tags
    assert video1.year == video2.year
    assert video1.thumbnail_url == video2.thumbnail_url
    assert video1.created_at == video2.created_at


def generate_test_videos(count: int, year: int = 2024) -> list[Video]:
    """Generate test videos with sequential IDs.

    Args:
        count: Number of videos to generate
        year: Year for all generated videos

    Returns:
        List of generated videos
    """
    videos = []
    for i in range(count):
        video = Video(
            video_id=f"gen_video_{i}",
            title=f"Generated Video {i}",
            tags=[f"tag_{i % 3}", f"subtag_{i % 2}"],
            year=year,
            thumbnail_url=f"https://example.com/gen_thumb_{i}.jpg"
            if i % 2 == 0
            else None,
            created_at=f"{year}-01-{i + 1:02d}T00:00:00Z" if i % 3 == 0 else None,
        )
        videos.append(video)

    return videos
