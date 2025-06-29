"""
Integration tests for tag hierarchy API endpoints.
Tests the complete flow from API request to database response.
"""

import pytest
import os
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.models.video import TagNode, Video
from app.services.dynamodb_service import DynamoDBService
from unittest.mock import AsyncMock, Mock, patch
import json

# Set environment variables for testing
os.environ["PROJECT_SEMANTIC_VERSION"] = "0.1.0"
os.environ["PROJECT_MAJOR_VERSION"] = "v1"
os.environ["AWS_ACCESS_KEY_ID"] = "test"
os.environ["AWS_SECRET_ACCESS_KEY"] = "test"
os.environ["AWS_DEFAULT_REGION"] = "us-east-1"
os.environ["DYNAMODB_TABLE_NAME"] = "test-videos"


@pytest.fixture
async def client():
    """Create async test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def mock_db_service():
    """Create mock DynamoDB service with test data."""
    mock_service = Mock(spec=DynamoDBService)

    # Mock video data with hierarchical tags
    mock_videos = [
        {
            "video_id": "test1",
            "title": "Horror Game Stream",
            "tags": ["ゲーム実況", "ホラー", "Cry of Fear"],
            "published_at": "2024-01-01T12:00:00Z",
            "duration": "PT1H30M",
            "year": 2024
        },
        {
            "video_id": "test2",
            "title": "ASMR Stream",
            "tags": ["ASMR", "耳かき", "バイノーラル"],
            "published_at": "2024-01-02T20:00:00Z",
            "duration": "PT45M",
            "year": 2024
        },
        {
            "video_id": "test3",
            "title": "Chat Stream",
            "tags": ["雑談", "フリートーク", "マシュマロ"],
            "published_at": "2024-01-03T15:00:00Z",
            "duration": "PT2H",
            "year": 2024
        },
        {
            "video_id": "test4",
            "title": "Short Video",
            "tags": ["shorts", "varkshorts"],
            "published_at": "2024-01-04T10:00:00Z",
            "duration": "PT30S",
            "year": 2024
        }
    ]

    mock_service.scan_all_videos = AsyncMock(return_value=mock_videos)
    mock_service.get_videos_by_tag_path = AsyncMock()

    return mock_service


class TestTagTreeAPI:
    """Test /api/tags endpoint for hierarchical tag tree."""

    @pytest.mark.asyncio
    async def test_get_tag_tree_success(self, client):
        """Test successful tag tree retrieval."""
        # Mock the tag hierarchy service's build_hierarchy_tree method
        with patch("app.routers.tag_hierarchy.hierarchy_service") as mock_service:
            mock_tree = TagNode(
                name="root",
                children=[
                    TagNode(name="ゲーム実況", count=1, level=0, hierarchy_path="ゲーム実況"),
                    TagNode(name="ASMR", count=1, level=0, hierarchy_path="ASMR"),
                ],
                count=2,
                level=0,
                hierarchy_path=""
            )
            mock_service.build_hierarchy_tree.return_value = mock_tree

            response = await client.get("/api/tags")

            assert response.status_code == 200
            data = response.json()

            # Verify response structure
            assert "tag_tree" in data
            assert "metadata" in data

            # Verify metadata
            metadata = data["metadata"]
            assert "total_videos" in metadata
            assert "hierarchy_coverage" in metadata
            assert "last_updated" in metadata

    @pytest.mark.asyncio
    async def test_tag_tree_hierarchy_structure(self, client, mock_db_service, monkeypatch):
        """Test that tag tree has correct hierarchical structure."""
        monkeypatch.setattr("app.services.dynamodb_service.DynamoDBService",
                           lambda: mock_db_service)

        response = await client.get("/api/tags")
        data = response.json()

        tag_tree = data["tag_tree"]

        # Verify major categories are present
        category_names = [node["name"] for node in tag_tree]
        assert "ゲーム実況" in category_names
        assert "ASMR" in category_names
        assert "雑談" in category_names
        assert "shorts" in category_names

        # Verify subcategories under game commentary
        game_node = next(node for node in tag_tree if node["name"] == "ゲーム実況")
        subcategory_names = [child["name"] for child in game_node["children"]]
        assert "ホラー" in subcategory_names

        # Verify each node has required fields
        for node in tag_tree:
            assert "name" in node
            assert "children" in node
            assert "count" in node
            assert "level" in node
            assert "hierarchy_path" in node

    @pytest.mark.asyncio
    async def test_tag_tree_video_counts(self, client, mock_db_service, monkeypatch):
        """Test that video counts in tag tree are accurate."""
        monkeypatch.setattr("app.services.dynamodb_service.DynamoDBService",
                           lambda: mock_db_service)

        response = await client.get("/api/tags")
        data = response.json()

        tag_tree = data["tag_tree"]

        # Find specific nodes and verify counts
        game_node = next(node for node in tag_tree if node["name"] == "ゲーム実況")
        assert game_node["count"] >= 1  # Should have at least one video

        asmr_node = next(node for node in tag_tree if node["name"] == "ASMR")
        assert asmr_node["count"] >= 1  # Should have at least one video

    @pytest.mark.asyncio
    async def test_tag_tree_performance(self, client, mock_db_service, monkeypatch):
        """Test tag tree API performance."""
        monkeypatch.setattr("app.services.dynamodb_service.DynamoDBService",
                           lambda: mock_db_service)

        import time
        start_time = time.time()

        response = await client.get("/api/tags")

        end_time = time.time()
        response_time = end_time - start_time

        assert response.status_code == 200
        assert response_time < 2.0  # Should respond within 2 seconds


class TestVideosByTagAPI:
    """Test /api/videos/by-tag/{tag_path} endpoint."""

    @pytest.mark.asyncio
    async def test_get_videos_by_hierarchical_tag(self, client, mock_db_service, monkeypatch):
        """Test filtering videos by hierarchical tag path."""
        # Mock return data for hierarchical tag query
        mock_videos = [
            {
                "video_id": "test1",
                "title": "Horror Game Stream",
                "tags": ["ゲーム実況", "ホラー", "Cry of Fear"],
                "published_at": "2024-01-01T12:00:00Z",
                "duration": "PT1H30M",
                "year": 2024
            }
        ]
        mock_db_service.get_videos_by_tag_path.return_value = mock_videos

        monkeypatch.setattr("app.services.dynamodb_service.DynamoDBService",
                           lambda: mock_db_service)

        # Test hierarchical tag path (URL encode Japanese characters)
        import urllib.parse
        tag_path = urllib.parse.quote("ゲーム実況/ホラー", safe='')
        response = await client.get(f"/api/videos/by-tag/{tag_path}")

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert "videos" in data
        assert "pagination" in data
        assert "tag_info" in data

        # Verify tag info
        tag_info = data["tag_info"]
        assert tag_info["hierarchy_path"] == tag_path
        assert "level" in tag_info
        assert "parent_path" in tag_info
        assert "children_paths" in tag_info

        # Verify videos match the tag filter
        videos = data["videos"]
        assert len(videos) > 0

        for video in videos:
            tags = video["tags"]
            # Should contain both ゲーム実況 and ホラー
            assert "ゲーム実況" in tags
            assert "ホラー" in tags

    @pytest.mark.asyncio
    async def test_get_videos_by_root_tag(self, client, mock_db_service, monkeypatch):
        """Test filtering videos by root-level tag."""
        mock_videos = [
            {
                "video_id": "test1",
                "title": "Horror Game Stream",
                "tags": ["ゲーム実況", "ホラー", "Cry of Fear"],
                "published_at": "2024-01-01T12:00:00Z",
                "duration": "PT1H30M",
                "year": 2024
            }
        ]
        mock_db_service.get_videos_by_tag_path.return_value = mock_videos

        monkeypatch.setattr("app.services.dynamodb_service.DynamoDBService",
                           lambda: mock_db_service)

        # Test root tag (URL encode Japanese characters)
        import urllib.parse
        tag_path = urllib.parse.quote("ゲーム実況", safe='')
        response = await client.get(f"/api/videos/by-tag/{tag_path}")

        assert response.status_code == 200
        data = response.json()

        tag_info = data["tag_info"]
        assert tag_info["hierarchy_path"] == "ゲーム実況"
        assert tag_info["level"] == 0  # Root level
        assert tag_info.get("parent_path") is None  # No parent for root

    @pytest.mark.asyncio
    async def test_get_videos_by_shorts_tag(self, client, mock_db_service, monkeypatch):
        """Test filtering videos by shorts tag."""
        mock_videos = [
            {
                "video_id": "test4",
                "title": "Short Video",
                "tags": ["shorts", "varkshorts"],
                "published_at": "2024-01-04T10:00:00Z",
                "duration": "PT30S",
                "year": 2024
            }
        ]
        mock_db_service.get_videos_by_tag_path.return_value = mock_videos

        monkeypatch.setattr("app.services.dynamodb_service.DynamoDBService",
                           lambda: mock_db_service)

        response = await client.get("/api/videos/by-tag/shorts")

        assert response.status_code == 200
        data = response.json()

        videos = data["videos"]
        assert len(videos) > 0

        for video in videos:
            assert "shorts" in video["tags"]

    @pytest.mark.asyncio
    async def test_get_videos_by_invalid_tag(self, client, mock_db_service, monkeypatch):
        """Test handling of invalid/non-existent tag paths."""
        mock_db_service.get_videos_by_tag_path.return_value = []

        monkeypatch.setattr("app.services.dynamodb_service.DynamoDBService",
                           lambda: mock_db_service)

        response = await client.get("/api/videos/by-tag/NonExistentTag")

        assert response.status_code == 200
        data = response.json()

        assert data["videos"] == []
        assert data["tag_info"]["hierarchy_path"] == "NonExistentTag"

    @pytest.mark.asyncio
    async def test_pagination_in_tag_results(self, client, mock_db_service, monkeypatch):
        """Test pagination works correctly with tag filtering."""
        # Create mock data with many videos
        mock_videos = []
        for i in range(25):  # More than default page size
            mock_videos.append({
                "video_id": f"test{i}",
                "title": f"Video {i}",
                "tags": ["ゲーム実況", "ホラー"],
                "published_at": f"2024-01-{i+1:02d}T12:00:00Z",
                "duration": "PT1H",
                "year": 2024
            })

        mock_db_service.get_videos_by_tag_path.return_value = mock_videos

        monkeypatch.setattr("app.services.dynamodb_service.DynamoDBService",
                           lambda: mock_db_service)

        # Test first page (URL encode Japanese characters)
        import urllib.parse
        tag_path = urllib.parse.quote("ゲーム実況", safe='')
        response = await client.get(f"/api/videos/by-tag/{tag_path}?page=1&limit=10")

        assert response.status_code == 200
        data = response.json()

        assert len(data["videos"]) == 10

        pagination = data["pagination"]
        assert pagination["page"] == 1
        assert pagination["limit"] == 10
        assert pagination["total"] == 25
        assert pagination["has_next"] is True


class TestTagNormalizeAPI:
    """Test /api/tags/normalize endpoint for tag normalization."""

    @pytest.mark.asyncio
    async def test_normalize_tags_success(self, client):
        """Test successful tag normalization."""
        request_data = {
            "tags": ["ゲーム実況", "ホラー", "Cry of Fear"]
        }

        response = await client.post("/api/tags/normalize", json=request_data)

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert "original_tags" in data
        assert "hierarchical_tags" in data
        assert "mapping_details" in data

        # Verify normalization worked
        assert data["original_tags"] == request_data["tags"]
        assert len(data["hierarchical_tags"]) > 0

        # Check for hierarchical structure
        hierarchical_tag = data["hierarchical_tags"][0]
        assert "/" in hierarchical_tag
        assert "ゲーム実況" in hierarchical_tag

    @pytest.mark.asyncio
    async def test_normalize_asmr_tags(self, client):
        """Test normalization of ASMR tags."""
        request_data = {
            "tags": ["ASMR", "耳かき", "バイノーラル"]
        }

        response = await client.post("/api/tags/normalize", json=request_data)

        assert response.status_code == 200
        data = response.json()

        # Should create ASMR hierarchy
        hierarchical_tags = data["hierarchical_tags"]
        asmr_hierarchy = next((tag for tag in hierarchical_tags if tag.startswith("ASMR/")), None)
        assert asmr_hierarchy is not None
        assert "耳かき" in asmr_hierarchy

    @pytest.mark.asyncio
    async def test_normalize_mixed_tags(self, client):
        """Test normalization of mixed hierarchical and flat tags."""
        request_data = {
            "tags": ["ゲーム実況", "ホラー", "コラボ", "健屋花那"]
        }

        response = await client.post("/api/tags/normalize", json=request_data)

        assert response.status_code == 200
        data = response.json()

        hierarchical_tags = data["hierarchical_tags"]

        # Should have both hierarchical and flat tags
        has_hierarchy = any("/" in tag for tag in hierarchical_tags)
        has_flat = any("/" not in tag for tag in hierarchical_tags)

        assert has_hierarchy  # Should have hierarchical tags
        assert has_flat      # Should preserve some flat tags

    @pytest.mark.asyncio
    async def test_normalize_empty_tags(self, client):
        """Test normalization with empty tag array."""
        request_data = {
            "tags": []
        }

        response = await client.post("/api/tags/normalize", json=request_data)

        assert response.status_code == 200
        data = response.json()

        assert data["original_tags"] == []
        assert data["hierarchical_tags"] == []
        assert data["mapping_details"] == []

    @pytest.mark.asyncio
    async def test_normalize_invalid_request(self, client):
        """Test normalization with invalid request data."""
        # Missing required field
        response = await client.post("/api/tags/normalize", json={})
        assert response.status_code == 422

        # Invalid data type
        response = await client.post("/api/tags/normalize", json={"tags": "not_an_array"})
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_mapping_details_accuracy(self, client):
        """Test that mapping details provide accurate information."""
        request_data = {
            "tags": ["ゲーム実況", "ホラー", "Cry of Fear"]
        }

        response = await client.post("/api/tags/normalize", json=request_data)
        data = response.json()

        mapping_details = data["mapping_details"]
        assert len(mapping_details) > 0

        for mapping in mapping_details:
            assert "original" in mapping
            assert "hierarchy_path" in mapping
            assert "confidence" in mapping
            assert "rule_applied" in mapping

            # Confidence should be between 0 and 1
            assert 0.0 <= mapping["confidence"] <= 1.0


class TestAPIErrorHandling:
    """Test API error handling scenarios."""

    @pytest.mark.asyncio
    async def test_tag_api_database_error(self, client, monkeypatch):
        """Test handling of database errors in tag API."""
        # Mock database service to raise exception
        mock_service = Mock()
        mock_service.scan_all_videos = AsyncMock(side_effect=Exception("Database error"))

        monkeypatch.setattr("app.services.dynamodb_service.DynamoDBService",
                           lambda: mock_service)

        response = await client.get("/api/tags")

        # Should handle error gracefully
        assert response.status_code == 500

    @pytest.mark.asyncio
    async def test_videos_by_tag_database_error(self, client, monkeypatch):
        """Test handling of database errors in videos by tag API."""
        mock_service = Mock()
        mock_service.get_videos_by_tag_path = AsyncMock(side_effect=Exception("Database error"))

        monkeypatch.setattr("app.services.dynamodb_service.DynamoDBService",
                           lambda: mock_service)

        import urllib.parse
        tag_path = urllib.parse.quote("ゲーム実況", safe='')
        response = await client.get(f"/api/videos/by-tag/{tag_path}")

        assert response.status_code == 500

    @pytest.mark.asyncio
    async def test_malformed_tag_path(self, client, mock_db_service, monkeypatch):
        """Test handling of malformed tag paths."""
        mock_db_service.get_videos_by_tag_path.return_value = []

        monkeypatch.setattr("app.services.dynamodb_service.DynamoDBService",
                           lambda: mock_db_service)

        # Test with malformed paths
        malformed_paths = [
            "///",
            "tag with spaces/invalid",
            "extremely/long/hierarchy/path/that/should/not/exist",
            ""
        ]

        for path in malformed_paths:
            response = await client.get(f"/api/videos/by-tag/{path}")
            # Should not crash, either return 200 with empty results or 400
            assert response.status_code in [200, 400]


class TestAPIPerformance:
    """Test API performance characteristics."""

    @pytest.mark.asyncio
    async def test_tag_tree_response_time(self, client, mock_db_service, monkeypatch):
        """Test that tag tree API responds within acceptable time."""
        monkeypatch.setattr("app.services.dynamodb_service.DynamoDBService",
                           lambda: mock_db_service)

        import time
        start_time = time.time()

        response = await client.get("/api/tags")

        end_time = time.time()
        response_time = end_time - start_time

        assert response.status_code == 200
        assert response_time < 1.0  # Should respond within 1 second

    @pytest.mark.asyncio
    async def test_videos_by_tag_response_time(self, client, mock_db_service, monkeypatch):
        """Test that videos by tag API responds within acceptable time."""
        mock_db_service.get_videos_by_tag_path.return_value = []

        monkeypatch.setattr("app.services.dynamodb_service.DynamoDBService",
                           lambda: mock_db_service)

        import time
        import urllib.parse
        start_time = time.time()

        tag_path = urllib.parse.quote("ゲーム実況", safe='')
        response = await client.get(f"/api/videos/by-tag/{tag_path}")

        end_time = time.time()
        response_time = end_time - start_time

        assert response.status_code == 200
        assert response_time < 0.5  # Should respond within 500ms
