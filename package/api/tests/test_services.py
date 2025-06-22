"""Unit tests for DynamoDB service."""

import json
from decimal import Decimal
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from botocore.exceptions import ClientError

from app.models.video import TagNode, Video
from app.services.dynamodb_service import DecimalEncoder, DynamoDBService


class TestDecimalEncoder:
    """Test cases for DecimalEncoder."""

    def test_encode_whole_decimal(self) -> None:
        """Test encoding whole number Decimal to int."""
        result = json.dumps(Decimal("42"), cls=DecimalEncoder)
        assert result == "42"

    def test_encode_decimal_with_fraction(self) -> None:
        """Test encoding Decimal with fraction to float."""
        result = json.dumps(Decimal("42.5"), cls=DecimalEncoder)
        assert result == "42.5"

    def test_encode_nested_decimal(self) -> None:
        """Test encoding nested structure with Decimal."""
        data = {
            "year": Decimal("2024"),
            "rating": Decimal("4.5"),
            "nested": {"count": Decimal("100")},
        }
        result = json.dumps(data, cls=DecimalEncoder)
        parsed = json.loads(result)

        assert parsed["year"] == 2024
        assert parsed["rating"] == 4.5
        assert parsed["nested"]["count"] == 100


class TestDynamoDBService:
    """Test cases for DynamoDBService."""

    @pytest.fixture
    def mock_table(self) -> MagicMock:
        """Create a mock DynamoDB table."""
        mock_table = MagicMock()
        return mock_table

    @pytest.fixture
    def service(self, mock_table: MagicMock) -> DynamoDBService:
        """Create DynamoDBService instance with mocked table."""
        service = DynamoDBService("test-table")
        service.table = mock_table
        return service

    def test_convert_dynamodb_item_to_video(self, service: DynamoDBService) -> None:
        """Test converting DynamoDB item to Video model."""
        item = {
            "video_id": "test123",
            "title": "Test Video",
            "tags": ["tag1", "tag2"],
            "year": Decimal("2024"),
            "thumbnail_url": "https://example.com/thumb.jpg",
            "created_at": "2024-01-01T00:00:00Z",
        }

        video = service._convert_dynamodb_item_to_video(item)

        assert video.video_id == "test123"
        assert video.title == "Test Video"
        assert video.tags == ["tag1", "tag2"]
        assert video.year == 2024
        assert video.thumbnail_url == "https://example.com/thumb.jpg"
        assert video.created_at == "2024-01-01T00:00:00Z"

    def test_convert_dynamodb_item_minimal(self, service: DynamoDBService) -> None:
        """Test converting minimal DynamoDB item to Video model."""
        item = {
            "video_id": "minimal",
            "title": "Minimal Video",
            "year": Decimal("2024"),
        }

        video = service._convert_dynamodb_item_to_video(item)

        assert video.video_id == "minimal"
        assert video.title == "Minimal Video"
        assert video.tags == []
        assert video.year == 2024
        assert video.thumbnail_url is None
        assert video.created_at is None

    @pytest.mark.asyncio
    async def test_get_videos_by_year_success(
        self, service: DynamoDBService, mock_table: MagicMock
    ) -> None:
        """Test successful get_videos_by_year."""
        mock_response = {
            "Items": [
                {
                    "video_id": "video1",
                    "title": "Video 1",
                    "year": Decimal("2024"),
                    "tags": ["tag1"],
                },
                {
                    "video_id": "video2",
                    "title": "Video 2",
                    "year": Decimal("2024"),
                    "tags": ["tag2"],
                },
            ],
            "LastEvaluatedKey": {
                "video_id": "video2",
                "year": Decimal("2024"),
            },
        }
        mock_table.query.return_value = mock_response

        videos, last_key = await service.get_videos_by_year(2024, limit=2)

        assert len(videos) == 2
        assert videos[0].video_id == "video1"
        assert videos[1].video_id == "video2"
        assert last_key is not None
        assert "video2" in last_key

        mock_table.query.assert_called_once()
        call_args = mock_table.query.call_args[1]
        assert call_args["IndexName"] == "GSI1"
        assert call_args["Limit"] == 2
        assert call_args["ScanIndexForward"] is False  # Verify descending sort

    @pytest.mark.asyncio
    async def test_get_videos_by_year_with_pagination(
        self, service: DynamoDBService, mock_table: MagicMock
    ) -> None:
        """Test get_videos_by_year with pagination."""
        last_key_str = json.dumps({"video_id": "prev", "year": 2024})
        mock_response = {"Items": []}  # No LastEvaluatedKey means no more pages
        mock_table.query.return_value = mock_response

        videos, last_key = await service.get_videos_by_year(
            2024, limit=50, last_key=last_key_str
        )

        assert len(videos) == 0
        assert last_key is None

        call_args = mock_table.query.call_args[1]
        assert "ExclusiveStartKey" in call_args
        assert call_args["ExclusiveStartKey"]["video_id"] == "prev"
        assert call_args["ScanIndexForward"] is False  # Verify descending sort

    @pytest.mark.asyncio
    async def test_get_videos_by_year_date_sorting(
        self, service: DynamoDBService, mock_table: MagicMock
    ) -> None:
        """Test that get_videos_by_year uses date descending sort."""
        mock_response = {
            "Items": [
                {
                    "video_id": "newest",
                    "title": "Newest Video",
                    "year": Decimal("2024"),
                    "created_at": "2024-12-01T00:00:00Z",
                },
                {
                    "video_id": "older",
                    "title": "Older Video",
                    "year": Decimal("2024"),
                    "created_at": "2024-01-01T00:00:00Z",
                },
            ]
        }
        mock_table.query.return_value = mock_response

        videos, _ = await service.get_videos_by_year(2024)

        # Verify query was called with proper sort parameters
        call_args = mock_table.query.call_args[1]
        assert call_args["ScanIndexForward"] is False  # Descending order

        # With descending sort, DynamoDB should return newest first
        assert len(videos) == 2
        assert videos[0].video_id == "newest"
        assert videos[1].video_id == "older"

    @pytest.mark.asyncio
    async def test_get_videos_by_year_error(
        self, service: DynamoDBService, mock_table: MagicMock
    ) -> None:
        """Test get_videos_by_year with DynamoDB error."""
        mock_table.query.side_effect = ClientError(
            {"Error": {"Code": "ResourceNotFoundException"}}, "Query"
        )

        with pytest.raises(RuntimeError, match="Failed to query videos by year"):
            await service.get_videos_by_year(2024)

    @pytest.mark.asyncio
    async def test_get_video_by_id_found(
        self, service: DynamoDBService, mock_table: MagicMock
    ) -> None:
        """Test successful get_video_by_id."""
        mock_response = {
            "Items": [
                {
                    "video_id": "found123",
                    "title": "Found Video",
                    "year": Decimal("2024"),
                }
            ]
        }
        mock_table.scan.return_value = mock_response

        video = await service.get_video_by_id("found123")

        assert video is not None
        assert video.video_id == "found123"
        assert video.title == "Found Video"

        # Verify scan was called with correct filter
        mock_table.scan.assert_called_once_with(
            FilterExpression="video_id = :video_id",
            ExpressionAttributeValues={":video_id": "found123"},
        )

    @pytest.mark.asyncio
    async def test_get_video_by_id_not_found(
        self, service: DynamoDBService, mock_table: MagicMock
    ) -> None:
        """Test get_video_by_id when video not found."""
        mock_table.scan.return_value = {"Items": []}

        video = await service.get_video_by_id("notfound")

        assert video is None

        # Verify scan was called with correct filter
        mock_table.scan.assert_called_once_with(
            FilterExpression="video_id = :video_id",
            ExpressionAttributeValues={":video_id": "notfound"},
        )

    @pytest.mark.asyncio
    async def test_get_video_by_id_error(
        self, service: DynamoDBService, mock_table: MagicMock
    ) -> None:
        """Test get_video_by_id with DynamoDB error."""
        mock_table.scan.side_effect = ClientError(
            {"Error": {"Code": "InternalServerError"}}, "Scan"
        )

        with pytest.raises(RuntimeError, match="Failed to get video by ID"):
            await service.get_video_by_id("error")

    @pytest.mark.asyncio
    async def test_get_video_by_id_multiple_matches(
        self, service: DynamoDBService, mock_table: MagicMock
    ) -> None:
        """Test get_video_by_id when multiple videos have same ID (edge case)."""
        mock_response = {
            "Items": [
                {
                    "video_id": "duplicate123",
                    "title": "First Video",
                    "year": Decimal("2024"),
                },
                {
                    "video_id": "duplicate123",
                    "title": "Second Video",
                    "year": Decimal("2023"),
                },
            ]
        }
        mock_table.scan.return_value = mock_response

        video = await service.get_video_by_id("duplicate123")

        assert video is not None
        assert video.video_id == "duplicate123"
        # Should return the first match
        assert video.title == "First Video"

    @pytest.mark.asyncio
    async def test_get_video_by_id_with_pk_sk_structure(
        self, service: DynamoDBService, mock_table: MagicMock
    ) -> None:
        """Test get_video_by_id works with PK/SK DynamoDB structure."""
        mock_response = {
            "Items": [
                {
                    "PK": "YEAR#2024",
                    "SK": "VIDEO#9xcMUP0l_Xs",
                    "video_id": "9xcMUP0l_Xs",
                    "title": "Test Video with PK/SK",
                    "year": Decimal("2024"),
                    "tags": ["test", "pk-sk"],
                    "thumbnail_url": "https://img.youtube.com/vi/9xcMUP0l_Xs/maxresdefault.jpg",
                    "created_at": "2024-01-01T12:00:00Z",
                }
            ]
        }
        mock_table.scan.return_value = mock_response

        video = await service.get_video_by_id("9xcMUP0l_Xs")

        assert video is not None
        assert video.video_id == "9xcMUP0l_Xs"
        assert video.title == "Test Video with PK/SK"
        assert video.year == 2024
        assert video.tags == ["test", "pk-sk"]
        assert (
            video.thumbnail_url
            == "https://img.youtube.com/vi/9xcMUP0l_Xs/maxresdefault.jpg"
        )
        assert video.created_at == "2024-01-01T12:00:00Z"

    def test_tags_match_path_exact_match(self, service: DynamoDBService) -> None:
        """Test _tags_match_path with exact match."""
        item_tags = ["ゲーム実況", "ホラー", "Cry of Fear"]
        path_tags = ["ゲーム実況", "ホラー", "Cry of Fear"]

        assert service._tags_match_path(item_tags, path_tags) is True

    def test_tags_match_path_partial_match(self, service: DynamoDBService) -> None:
        """Test _tags_match_path with partial match."""
        item_tags = ["ゲーム実況", "ホラー", "Cry of Fear", "Part 1"]
        path_tags = ["ホラー", "Cry of Fear"]

        assert service._tags_match_path(item_tags, path_tags) is True

    def test_tags_match_path_no_match(self, service: DynamoDBService) -> None:
        """Test _tags_match_path with no match."""
        item_tags = ["雑談", "料理"]
        path_tags = ["ゲーム実況", "ホラー"]

        assert service._tags_match_path(item_tags, path_tags) is False

    def test_tags_match_path_empty_path(self, service: DynamoDBService) -> None:
        """Test _tags_match_path with empty path."""
        item_tags = ["any", "tags"]
        path_tags = []

        assert service._tags_match_path(item_tags, path_tags) is True

    @pytest.mark.asyncio
    async def test_get_videos_by_tag_path(
        self, service: DynamoDBService, mock_table: MagicMock
    ) -> None:
        """Test get_videos_by_tag_path."""
        mock_response = {
            "Items": [
                {
                    "video_id": "horror1",
                    "title": "Horror Game 1",
                    "year": Decimal("2024"),
                    "tags": ["ゲーム実況", "ホラー", "Cry of Fear"],
                },
                {
                    "video_id": "other1",
                    "title": "Other Video",
                    "year": Decimal("2024"),
                    "tags": ["雑談", "料理"],
                },
                {
                    "video_id": "horror2",
                    "title": "Horror Game 2",
                    "year": Decimal("2024"),
                    "tags": ["ゲーム実況", "ホラー", "Amnesia"],
                },
            ]
        }
        mock_table.scan.return_value = mock_response

        videos = await service.get_videos_by_tag_path("ゲーム実況/ホラー")

        assert len(videos) == 2
        assert all("ホラー" in v.tags for v in videos)
        assert videos[0].video_id == "horror1"
        assert videos[1].video_id == "horror2"

    @pytest.mark.asyncio
    async def test_get_random_videos(
        self, service: DynamoDBService, mock_table: MagicMock
    ) -> None:
        """Test get_random_videos."""
        mock_response = {
            "Items": [
                {
                    "video_id": f"video{i}",
                    "title": f"Video {i}",
                    "year": Decimal("2024"),
                }
                for i in range(10)
            ]
        }
        mock_table.scan.return_value = mock_response

        videos = await service.get_random_videos(count=3)

        assert len(videos) == 3
        # Check that all videos are from the original set
        video_ids = {v.video_id for v in videos}
        assert all(vid.startswith("video") for vid in video_ids)

    @pytest.mark.asyncio
    async def test_get_random_videos_empty_table(
        self, service: DynamoDBService, mock_table: MagicMock
    ) -> None:
        """Test get_random_videos with empty table."""
        mock_table.scan.return_value = {"Items": []}

        videos = await service.get_random_videos(count=5)

        assert len(videos) == 0

    @pytest.mark.asyncio
    async def test_get_memory_thumbnails(
        self, service: DynamoDBService, mock_table: MagicMock
    ) -> None:
        """Test get_memory_thumbnails."""
        mock_response = {
            "Items": [
                {
                    "video_id": f"video{i}",
                    "title": f"Video {i}",
                    "year": Decimal("2024"),
                    "thumbnail_url": f"https://example.com/thumb{i}.jpg",
                }
                for i in range(10)
            ]
        }
        mock_table.scan.return_value = mock_response

        thumbnails = await service.get_memory_thumbnails(pairs=4)

        assert len(thumbnails) == 8  # 4 pairs * 2
        # Check that each thumbnail appears exactly twice
        unique_thumbnails = set(thumbnails)
        assert len(unique_thumbnails) == 4
        for thumb in unique_thumbnails:
            assert thumbnails.count(thumb) == 2

    @pytest.mark.asyncio
    async def test_get_memory_thumbnails_no_thumbnails(
        self, service: DynamoDBService, mock_table: MagicMock
    ) -> None:
        """Test get_memory_thumbnails when no videos have thumbnails."""
        mock_response = {
            "Items": [
                {
                    "video_id": "no_thumb",
                    "title": "No Thumbnail",
                    "year": Decimal("2024"),
                }
            ]
        }
        mock_table.scan.return_value = mock_response

        thumbnails = await service.get_memory_thumbnails(pairs=5)

        assert len(thumbnails) == 0

    def test_add_tags_to_tree(self, service: DynamoDBService) -> None:
        """Test _add_tags_to_tree method."""
        tree: dict[str, Any] = {}

        service._add_tags_to_tree(tree, ["ゲーム実況", "ホラー", "Cry of Fear"])
        service._add_tags_to_tree(tree, ["ゲーム実況", "ホラー", "Amnesia"])
        service._add_tags_to_tree(tree, ["ゲーム実況", "アクション"])

        assert "ゲーム実況" in tree
        assert tree["ゲーム実況"]["count"] == 3
        assert "ホラー" in tree["ゲーム実況"]["children"]
        assert tree["ゲーム実況"]["children"]["ホラー"]["count"] == 2
        assert "Cry of Fear" in tree["ゲーム実況"]["children"]["ホラー"]["children"]
        assert "Amnesia" in tree["ゲーム実況"]["children"]["ホラー"]["children"]
        assert "アクション" in tree["ゲーム実況"]["children"]

    def test_dict_to_tag_nodes(self, service: DynamoDBService) -> None:
        """Test _dict_to_tag_nodes method."""
        tree = {
            "ゲーム実況": {
                "count": 2,
                "children": {
                    "ホラー": {"count": 1, "children": {}},
                    "アクション": {"count": 1, "children": {}},
                },
            }
        }

        nodes = service._dict_to_tag_nodes(tree)

        assert len(nodes) == 1
        assert nodes[0].name == "ゲーム実況"
        assert nodes[0].count == 2
        assert len(nodes[0].children) == 2  # type: ignore
        # Check children are sorted
        assert nodes[0].children[0].name == "アクション"  # type: ignore
        assert nodes[0].children[1].name == "ホラー"  # type: ignore

    @pytest.mark.asyncio
    async def test_build_tag_tree(
        self, service: DynamoDBService, mock_table: MagicMock
    ) -> None:
        """Test build_tag_tree."""
        mock_response = {
            "Items": [
                {
                    "video_id": "video1",
                    "tags": ["ゲーム実況", "ホラー", "Cry of Fear"],
                },
                {
                    "video_id": "video2",
                    "tags": ["ゲーム実況", "ホラー", "Amnesia"],
                },
                {
                    "video_id": "video3",
                    "tags": ["雑談", "料理"],
                },
            ]
        }
        mock_table.scan.return_value = mock_response

        tag_tree = await service.build_tag_tree()

        assert len(tag_tree) == 2
        # Find nodes (they should be sorted)
        game_node = next(n for n in tag_tree if n.name == "ゲーム実況")
        chat_node = next(n for n in tag_tree if n.name == "雑談")

        assert game_node.count == 2
        assert len(game_node.children) == 1  # type: ignore
        assert game_node.children[0].name == "ホラー"  # type: ignore
        assert game_node.children[0].count == 2  # type: ignore
        assert len(game_node.children[0].children) == 2  # type: ignore

        assert chat_node.count == 1
        assert len(chat_node.children) == 1  # type: ignore
        assert chat_node.children[0].name == "料理"  # type: ignore
