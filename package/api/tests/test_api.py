"""Integration tests for API endpoints."""

import json
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.video import TagNode, Video
from app.services.dynamodb_service import DynamoDBService


@pytest.fixture
def client() -> TestClient:
    """Create FastAPI test client."""
    # Use sync TestClient to avoid asyncio backend issues
    return TestClient(app)


@pytest.fixture
def mock_db_service() -> MagicMock:
    """Create mock DynamoDB service."""
    return MagicMock(spec=DynamoDBService)


class TestHealthEndpoints:
    """Test cases for health check endpoints."""

    def test_health_check(self, client: TestClient) -> None:
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy", "service": "diopside-backend"}

    def test_api_health_check(self, client: TestClient) -> None:
        """Test API health check endpoint."""
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy", "api": "operational"}


class TestVideoEndpoints:
    """Test cases for video API endpoints."""

    @patch("routers.videos.db_service")
    def test_get_videos_by_year_success(
        self, mock_db: MagicMock, client: TestClient
    ) -> None:
        """Test successful get videos by year."""
        mock_videos = [
            {
                "video_id": "video1",
                "title": "Video 1",
                "tags": ["tag1"],
                "year": 2024,
                "thumbnail_url": "https://example.com/thumb1.jpg",
                "created_at": None,
            },
            {
                "video_id": "video2",
                "title": "Video 2",
                "tags": ["tag2"],
                "year": 2024,
                "thumbnail_url": None,
                "created_at": None,
            },
        ]
        mock_db.get_videos_by_year = AsyncMock(return_value=(mock_videos, "next_key"))

        response = client.get("/api/videos?year=2024&limit=2")

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["items"][0]["video_id"] == "video1"
        assert data["items"][1]["video_id"] == "video2"
        assert data["last_key"] == "next_key"

    @patch("routers.videos.db_service")
    def test_get_videos_by_year_with_pagination(
        self, mock_db: MagicMock, client: TestClient
    ) -> None:
        """Test get videos by year with pagination."""
        mock_db.get_videos_by_year = AsyncMock(return_value=([], None))

        response = client.get("/api/videos?year=2024&last_key=some_key")

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 0
        assert data["last_key"] is None

    def test_get_videos_by_year_missing_year(self, client: TestClient) -> None:
        """Test get videos by year without year parameter."""
        response = client.get("/api/videos")
        assert response.status_code == 422

    def test_get_videos_by_year_invalid_limit(self, client: TestClient) -> None:
        """Test get videos by year with invalid limit."""
        response = client.get("/api/videos?year=2024&limit=101")
        assert response.status_code == 422

    @patch("routers.videos.db_service")
    def test_get_videos_by_year_db_error(
        self, mock_db: MagicMock, client: TestClient
    ) -> None:
        """Test get videos by year with database error."""
        mock_db.get_videos_by_year = AsyncMock(
            side_effect=RuntimeError("Database connection failed")
        )

        response = client.get("/api/videos?year=2024")

        assert response.status_code == 500
        assert "Database connection failed" in response.json()["detail"]

    @patch("routers.videos.db_service")
    def test_get_tag_tree_success(self, mock_db: MagicMock, client: TestClient) -> None:
        """Test successful get tag tree."""
        mock_tags = [
            {
                "name": "ゲーム実況",
                "children": [
                    {"name": "ホラー", "children": None, "count": 5},
                    {"name": "アクション", "children": None, "count": 3},
                ],
                "count": 2,
            },
            {"name": "雑談", "children": None, "count": 10},
        ]
        mock_db.build_tag_tree = AsyncMock(return_value=mock_tags)

        response = client.get("/api/tags")

        assert response.status_code == 200
        data = response.json()
        assert len(data["tree"]) == 2
        assert data["tree"][0]["name"] == "ゲーム実況"
        assert len(data["tree"][0]["children"]) == 2
        assert data["tree"][1]["name"] == "雑談"

    @patch("routers.videos.db_service")
    def test_get_videos_by_tag_success(
        self, mock_db: MagicMock, client: TestClient
    ) -> None:
        """Test successful get videos by tag."""
        mock_videos = [
            {
                "video_id": "horror1",
                "title": "Horror Game 1",
                "tags": ["ゲーム実況", "ホラー", "Cry of Fear"],
                "year": 2024,
                "thumbnail_url": None,
                "created_at": None,
            },
            {
                "video_id": "horror2",
                "title": "Horror Game 2",
                "tags": ["ゲーム実況", "ホラー", "Amnesia"],
                "year": 2024,
                "thumbnail_url": None,
                "created_at": None,
            },
        ]
        mock_db.get_videos_by_tag_path = AsyncMock(return_value=mock_videos)

        response = client.get("/api/videos/by-tag?path=ゲーム実況/ホラー")

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert all("ホラー" in item["tags"] for item in data["items"])

    def test_get_videos_by_tag_missing_path(self, client: TestClient) -> None:
        """Test get videos by tag without path parameter."""
        response = client.get("/api/videos/by-tag")
        assert response.status_code == 422

    @patch("routers.videos.db_service")
    def test_get_random_videos_success(
        self, mock_db: MagicMock, client: TestClient
    ) -> None:
        """Test successful get random videos."""
        mock_videos = [
            {
                "video_id": f"random{i}",
                "title": f"Random {i}",
                "tags": [],
                "year": 2024,
                "thumbnail_url": None,
                "created_at": None,
            }
            for i in range(3)
        ]
        mock_db.get_random_videos = AsyncMock(return_value=mock_videos)

        response = client.get("/api/videos/random?count=3")

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 3
        assert all(item["video_id"].startswith("random") for item in data["items"])

    def test_get_random_videos_default_count(self, client: TestClient) -> None:
        """Test get random videos with default count."""
        with patch("routers.videos.db_service") as mock_db:
            mock_db.get_random_videos = AsyncMock(
                return_value=[
                    {
                        "video_id": "single",
                        "title": "Single Video",
                        "tags": [],
                        "year": 2024,
                        "thumbnail_url": None,
                        "created_at": None,
                    }
                ]
            )

            response = client.get("/api/videos/random")

            assert response.status_code == 200
            data = response.json()
            assert len(data["items"]) == 1

    def test_get_random_videos_invalid_count(self, client: TestClient) -> None:
        """Test get random videos with invalid count."""
        response = client.get("/api/videos/random?count=21")
        assert response.status_code == 422

    @patch("routers.videos.db_service")
    def test_get_memory_thumbnails_success(
        self, mock_db: MagicMock, client: TestClient
    ) -> None:
        """Test successful get memory thumbnails."""
        mock_thumbnails = [
            "https://example.com/thumb1.jpg",
            "https://example.com/thumb1.jpg",
            "https://example.com/thumb2.jpg",
            "https://example.com/thumb2.jpg",
        ]
        mock_db.get_memory_thumbnails = AsyncMock(return_value=mock_thumbnails)

        response = client.get("/api/videos/memory?pairs=2")

        assert response.status_code == 200
        data = response.json()
        assert len(data["thumbnails"]) == 4
        # Check each thumbnail appears exactly twice
        unique_thumbs = set(data["thumbnails"])
        assert len(unique_thumbs) == 2

    def test_get_memory_thumbnails_default_pairs(self, client: TestClient) -> None:
        """Test get memory thumbnails with default pairs."""
        with patch("routers.videos.db_service") as mock_db:
            mock_db.get_memory_thumbnails = AsyncMock(return_value=["t"] * 16)

            response = client.get("/api/videos/memory")

            assert response.status_code == 200
            data = response.json()
            assert len(data["thumbnails"]) == 16  # Default 8 pairs

    def test_get_memory_thumbnails_invalid_pairs(self, client: TestClient) -> None:
        """Test get memory thumbnails with invalid pairs."""
        response = client.get("/api/videos/memory?pairs=1")
        assert response.status_code == 422

        response = client.get("/api/videos/memory?pairs=21")
        assert response.status_code == 422

    @patch("routers.videos.db_service")
    def test_get_video_by_id_success(
        self, mock_db: MagicMock, client: TestClient
    ) -> None:
        """Test successful get video by id."""
        mock_video = Video(
            video_id="test123",
            title="Test Video",
            tags=["test", "video"],
            year=2024,
            thumbnail_url="https://example.com/test.jpg",
            created_at="2024-01-01T00:00:00Z",
        )
        mock_db.get_video_by_id = AsyncMock(return_value=mock_video)

        response = client.get("/api/videos/test123")

        assert response.status_code == 200
        data = response.json()
        assert data["video_id"] == "test123"
        assert data["title"] == "Test Video"
        assert data["tags"] == ["test", "video"]
        assert data["year"] == 2024
        assert data["thumbnail_url"] == "https://example.com/test.jpg"
        assert data["created_at"] == "2024-01-01T00:00:00Z"

    @patch("routers.videos.db_service")
    def test_get_video_by_id_not_found(
        self, mock_db: MagicMock, client: TestClient
    ) -> None:
        """Test get video by id when not found."""
        mock_db.get_video_by_id = AsyncMock(return_value=None)

        response = client.get("/api/videos/notfound")

        assert response.status_code == 404
        assert response.json()["detail"] == "Video not found"

    @patch("routers.videos.db_service")
    def test_get_video_by_id_db_error(
        self, mock_db: MagicMock, client: TestClient
    ) -> None:
        """Test get video by id with database error."""
        mock_db.get_video_by_id = AsyncMock(side_effect=RuntimeError("Database error"))

        response = client.get("/api/videos/error123")

        assert response.status_code == 500
        assert "Database error" in response.json()["detail"]


class TestCORSHeaders:
    """Test cases for CORS configuration."""

    def test_cors_headers_on_api_endpoint(self, client: TestClient) -> None:
        """Test CORS headers are present on API endpoints."""
        response = client.options(
            "/api/videos",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )

        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers
        assert "access-control-allow-methods" in response.headers
        assert "GET" in response.headers["access-control-allow-methods"]
