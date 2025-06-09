"""Tests for API endpoints."""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models import TagNode, Video

client = TestClient(app)


class TestAPIEndpoints:
    """Test cases for API endpoints."""

    def test_root_endpoint(self) -> None:
        """Test root endpoint."""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Diopside API is running"
        assert data["status"] == "healthy"

    def test_health_check_endpoint(self) -> None:
        """Test health check endpoint."""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "diopside-backend"

    @patch("app.routers.videos.db_service.get_videos_by_year")
    def test_get_videos_by_year(self, mock_get_videos: AsyncMock) -> None:
        """Test getting videos by year."""
        # Mock response
        mock_videos = [
            Video(
                video_id="test1",
                title="Test Video 1",
                tags=["ゲーム実況"],
                year=2023,
                thumbnail_url="https://example.com/thumb1.jpg",
            ),
            Video(
                video_id="test2",
                title="Test Video 2",
                tags=["ゲーム実況", "ホラー"],
                year=2023,
                thumbnail_url="https://example.com/thumb2.jpg",
            ),
        ]
        mock_get_videos.return_value = (mock_videos, None)
        
        response = client.get("/api/videos?year=2023")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["last_key"] is None
        assert data["items"][0]["video_id"] == "test1"
        assert data["items"][1]["video_id"] == "test2"

    def test_get_videos_by_year_missing_parameter(self) -> None:
        """Test getting videos by year without required parameter."""
        response = client.get("/api/videos")
        
        assert response.status_code == 422  # Validation error

    @patch("app.routers.videos.db_service.get_videos_by_year")
    def test_get_videos_by_year_with_pagination(self, mock_get_videos: AsyncMock) -> None:
        """Test getting videos by year with pagination."""
        mock_videos = [
            Video(
                video_id="test1",
                title="Test Video 1",
                tags=["ゲーム実況"],
                year=2023,
            )
        ]
        mock_get_videos.return_value = (mock_videos, "next_key_123")
        
        response = client.get("/api/videos?year=2023&limit=1")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["last_key"] == "next_key_123"

    @patch("app.routers.videos.db_service.build_tag_tree")
    def test_get_tag_tree(self, mock_build_tree: AsyncMock) -> None:
        """Test getting tag tree."""
        mock_tree = [
            TagNode(
                name="ゲーム実況",
                children=[
                    TagNode(name="ホラー", count=5),
                    TagNode(name="アクション", count=3),
                ],
                count=2,
            )
        ]
        mock_build_tree.return_value = mock_tree
        
        response = client.get("/api/tags")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["tree"]) == 1
        assert data["tree"][0]["name"] == "ゲーム実況"
        assert data["tree"][0]["count"] == 2
        assert len(data["tree"][0]["children"]) == 2

    @patch("app.routers.videos.db_service.get_videos_by_tag_path")
    def test_get_videos_by_tag(self, mock_get_by_tag: AsyncMock) -> None:
        """Test getting videos by tag path."""
        mock_videos = [
            Video(
                video_id="test1",
                title="Horror Game",
                tags=["ゲーム実況", "ホラー", "Cry of Fear"],
                year=2023,
            )
        ]
        mock_get_by_tag.return_value = mock_videos
        
        response = client.get("/api/videos/by-tag?path=ゲーム実況/ホラー")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["video_id"] == "test1"

    def test_get_videos_by_tag_missing_parameter(self) -> None:
        """Test getting videos by tag without required parameter."""
        response = client.get("/api/videos/by-tag")
        
        assert response.status_code == 422  # Validation error

    @patch("app.routers.videos.db_service.get_random_videos")
    def test_get_random_videos(self, mock_get_random: AsyncMock) -> None:
        """Test getting random videos."""
        mock_videos = [
            Video(
                video_id="random1",
                title="Random Video",
                tags=["ゲーム実況"],
                year=2023,
            )
        ]
        mock_get_random.return_value = mock_videos
        
        response = client.get("/api/videos/random")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["video_id"] == "random1"

    @patch("app.routers.videos.db_service.get_random_videos")
    def test_get_random_videos_with_count(self, mock_get_random: AsyncMock) -> None:
        """Test getting multiple random videos."""
        mock_videos = [
            Video(video_id="random1", title="Random 1", tags=[], year=2023),
            Video(video_id="random2", title="Random 2", tags=[], year=2023),
        ]
        mock_get_random.return_value = mock_videos
        
        response = client.get("/api/videos/random?count=2")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2

    @patch("app.routers.videos.db_service.get_memory_thumbnails")
    def test_get_memory_thumbnails(self, mock_get_thumbnails: AsyncMock) -> None:
        """Test getting memory game thumbnails."""
        mock_thumbnails = [
            "https://example.com/thumb1.jpg",
            "https://example.com/thumb1.jpg",
            "https://example.com/thumb2.jpg",
            "https://example.com/thumb2.jpg",
        ]
        mock_get_thumbnails.return_value = mock_thumbnails
        
        response = client.get("/api/videos/memory")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["thumbnails"]) == 4

    @patch("app.routers.videos.db_service.get_memory_thumbnails")
    def test_get_memory_thumbnails_with_pairs(self, mock_get_thumbnails: AsyncMock) -> None:
        """Test getting memory game thumbnails with custom pairs."""
        mock_thumbnails = ["url1", "url1", "url2", "url2", "url3", "url3"]
        mock_get_thumbnails.return_value = mock_thumbnails
        
        response = client.get("/api/videos/memory?pairs=3")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["thumbnails"]) == 6

    @patch("app.routers.videos.db_service.get_video_by_id")
    def test_get_video_by_id_exists(self, mock_get_video: AsyncMock) -> None:
        """Test getting an existing video by ID."""
        mock_video = Video(
            video_id="test123",
            title="Test Video",
            tags=["ゲーム実況"],
            year=2023,
            thumbnail_url="https://example.com/thumb.jpg",
        )
        mock_get_video.return_value = mock_video
        
        response = client.get("/api/videos/test123")
        
        assert response.status_code == 200
        data = response.json()
        assert data["video_id"] == "test123"
        assert data["title"] == "Test Video"

    @patch("app.routers.videos.db_service.get_video_by_id")
    def test_get_video_by_id_not_found(self, mock_get_video: AsyncMock) -> None:
        """Test getting a non-existent video by ID."""
        mock_get_video.return_value = None
        
        response = client.get("/api/videos/nonexistent")
        
        assert response.status_code == 404
        data = response.json()
        assert data["detail"] == "Video not found"

    @patch("app.routers.videos.db_service.get_videos_by_year")
    def test_api_error_handling(self, mock_get_videos: AsyncMock) -> None:
        """Test API error handling."""
        mock_get_videos.side_effect = RuntimeError("Database connection failed")
        
        response = client.get("/api/videos?year=2023")
        
        assert response.status_code == 500
        data = response.json()
        assert "Database connection failed" in data["detail"]