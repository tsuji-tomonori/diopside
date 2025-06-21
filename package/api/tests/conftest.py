"""Pytest configuration and shared fixtures."""

import asyncio
import os
import sys
from pathlib import Path
from typing import Any, AsyncGenerator, Generator

import pytest
from fastapi.testclient import TestClient

# Add app directory to Python path for imports
app_dir = Path(__file__).parent.parent / "app"
sys.path.insert(0, str(app_dir))

# Set environment variables before importing app
os.environ["AWS_DEFAULT_REGION"] = "us-east-1"
os.environ["DYNAMODB_TABLE_NAME"] = "test-videos-table"
os.environ["PROJECT_SEMANTIC_VERSION"] = "1.0.0-test"
os.environ["PROJECT_MAJOR_VERSION"] = "v1"

from app.main import app
from app.models.video import Video


@pytest.fixture(scope="function")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for each test."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop
    loop.close()


@pytest.fixture
def test_client() -> TestClient:
    """Create a FastAPI test client."""
    return TestClient(app)


@pytest.fixture
def sample_videos() -> list[Video]:
    """Provide sample videos for testing."""
    return [
        Video(
            video_id="test_video_1",
            title="【ゲーム実況】Cry of Fear Part 1",
            tags=["ゲーム実況", "ホラー", "Cry of Fear"],
            year=2023,
            thumbnail_url="https://i.ytimg.com/vi/test_video_1/maxresdefault.jpg",
            created_at="2023-10-15T14:30:00Z",
        ),
        Video(
            video_id="test_video_2",
            title="【雑談】今日の料理について",
            tags=["雑談", "料理"],
            year=2023,
            thumbnail_url="https://i.ytimg.com/vi/test_video_2/maxresdefault.jpg",
            created_at="2023-10-16T18:00:00Z",
        ),
        Video(
            video_id="test_video_3",
            title="【ゲーム実況】アクションゲーム配信",
            tags=["ゲーム実況", "アクション"],
            year=2024,
            thumbnail_url="https://i.ytimg.com/vi/test_video_3/maxresdefault.jpg",
            created_at="2024-01-10T20:00:00Z",
        ),
        Video(
            video_id="test_video_4",
            title="【歌枠】カラオケ配信",
            tags=["歌枠", "カラオケ"],
            year=2024,
            thumbnail_url=None,  # Video without thumbnail
            created_at="2024-02-14T19:00:00Z",
        ),
    ]


@pytest.fixture
def dynamodb_items() -> list[dict[str, Any]]:
    """Provide sample DynamoDB items for testing."""
    from decimal import Decimal

    return [
        {
            "video_id": "db_video_1",
            "title": "Database Video 1",
            "tags": ["tag1", "tag2", "tag3"],
            "year": Decimal("2023"),
            "thumbnail_url": "https://example.com/thumb1.jpg",
            "created_at": "2023-01-01T00:00:00Z",
        },
        {
            "video_id": "db_video_2",
            "title": "Database Video 2",
            "tags": ["tag1", "tag4"],
            "year": Decimal("2024"),
            "thumbnail_url": "https://example.com/thumb2.jpg",
            "created_at": "2024-01-01T00:00:00Z",
        },
        {
            "video_id": "db_video_3",
            "title": "Database Video 3",
            "tags": [],  # Video with no tags
            "year": Decimal("2024"),
            # No thumbnail_url
            # No created_at
        },
    ]


@pytest.fixture
def mock_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    """Mock environment variables for testing."""
    monkeypatch.setenv("DYNAMODB_TABLE_NAME", "test-videos-table")
    monkeypatch.setenv("AWS_REGION", "us-east-1")
    monkeypatch.setenv("AWS_DEFAULT_REGION", "us-east-1")
