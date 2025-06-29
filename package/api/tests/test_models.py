"""Unit tests for Pydantic models."""

import pytest
from pydantic import ValidationError

from app.models.video import TagNode, Video


class TestVideoModel:
    """Test cases for Video model."""

    def test_video_creation_with_all_fields(self) -> None:
        """Test creating a video with all fields."""
        video = Video(
            video_id="dQw4w9WgXcQ",
            title="【ホラーゲーム】Cry of Fear 実況プレイ #1",
            tags=["ゲーム実況", "ホラー", "Cry of Fear"],
            year=2023,
            thumbnail_url="https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
            created_at="2023-10-15T14:30:00Z",
        )

        assert video.video_id == "dQw4w9WgXcQ"
        assert video.title == "【ホラーゲーム】Cry of Fear 実況プレイ #1"
        assert video.tags == ["ゲーム実況", "ホラー", "Cry of Fear"]
        assert video.year == 2023
        assert (
            video.thumbnail_url
            == "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
        )
        assert video.created_at == "2023-10-15T14:30:00Z"

    def test_video_creation_with_required_fields_only(self) -> None:
        """Test creating a video with only required fields."""
        video = Video(
            video_id="abc123",
            title="Test Video",
            year=2024,
        )  # type: ignore

        assert video.video_id == "abc123"
        assert video.title == "Test Video"
        assert video.tags == []
        assert video.year == 2024
        assert video.thumbnail_url is None
        assert video.created_at is None

    def test_video_creation_with_empty_tags(self) -> None:
        """Test creating a video with explicitly empty tags."""
        video = Video(
            video_id="test123",
            title="No Tags Video",
            tags=[],
            year=2024,
        )  # type: ignore

        assert video.tags == []

    def test_video_missing_required_fields(self) -> None:
        """Test that missing required fields raise validation error."""
        with pytest.raises(ValidationError) as exc_info:
            Video(
                title="Missing video_id",
                year=2024,
            )  # type: ignore

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("video_id",) for error in errors)

    def test_video_invalid_year_type(self) -> None:
        """Test that invalid year type raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            Video(
                video_id="test",
                title="Invalid Year",
                year="not_a_number",  # type: ignore
            )

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("year",) for error in errors)

    def test_video_model_serialization(self) -> None:
        """Test video model serialization to dict."""
        video = Video(
            video_id="test_id",
            title="Test Title",
            tags=["tag1", "tag2"],
            year=2024,
            thumbnail_url="https://example.com/thumb.jpg",
            created_at="2024-01-01T00:00:00Z",
        )

        video_dict = video.model_dump()

        assert video_dict == {
            "video_id": "test_id",
            "title": "Test Title",
            "tags": ["tag1", "tag2"],
            "year": 2024,
            "thumbnail_url": "https://example.com/thumb.jpg",
            "created_at": "2024-01-01T00:00:00Z",
        }

    def test_video_model_json_serialization(self) -> None:
        """Test video model JSON serialization."""
        video = Video(
            video_id="json_test",
            title="JSON Test",
            year=2024,
        )  # type: ignore

        json_str = video.model_dump_json()
        assert '"video_id":"json_test"' in json_str
        assert '"title":"JSON Test"' in json_str
        assert '"year":2024' in json_str


class TestTagNodeModel:
    """Test cases for TagNode model."""

    def test_tag_node_creation_simple(self) -> None:
        """Test creating a simple tag node without children."""
        tag = TagNode(name="ゲーム実況")  # type: ignore

        assert tag.name == "ゲーム実況"
        assert tag.children == []  # Now defaults to empty list
        assert tag.count == 0  # Now defaults to 0

    def test_tag_node_creation_with_count(self) -> None:
        """Test creating a tag node with count."""
        tag = TagNode(name="ホラー", count=10)  # type: ignore

        assert tag.name == "ホラー"
        assert tag.count == 10
        assert tag.children == []  # Now defaults to empty list

    def test_tag_node_creation_with_children(self) -> None:
        """Test creating a tag node with nested children."""
        child1 = TagNode(name="Cry of Fear", count=5)  # type: ignore
        child2 = TagNode(name="Amnesia", count=3)  # type: ignore

        parent = TagNode(
            name="ホラー",
            children=[child1, child2],
            count=2,
        )

        assert parent.name == "ホラー"
        assert parent.count == 2
        assert len(parent.children) == 2  # type: ignore
        assert parent.children[0].name == "Cry of Fear"  # type: ignore
        assert parent.children[0].count == 5  # type: ignore
        assert parent.children[1].name == "Amnesia"  # type: ignore
        assert parent.children[1].count == 3  # type: ignore

    def test_tag_node_deep_nesting(self) -> None:
        """Test creating deeply nested tag nodes."""
        level3 = TagNode(name="Episode 1", count=1)  # type: ignore
        level2 = TagNode(name="Cry of Fear", children=[level3], count=1)
        level1 = TagNode(name="ホラー", children=[level2], count=1)
        root = TagNode(name="ゲーム実況", children=[level1], count=1)

        assert root.name == "ゲーム実況"
        assert root.children[0].name == "ホラー"  # type: ignore
        assert root.children[0].children[0].name == "Cry of Fear"  # type: ignore
        assert root.children[0].children[0].children[0].name == "Episode 1"  # type: ignore

    def test_tag_node_missing_required_fields(self) -> None:
        """Test that missing required fields raise validation error."""
        with pytest.raises(ValidationError) as exc_info:
            TagNode(children=[])  # type: ignore

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("name",) for error in errors)

    def test_tag_node_model_serialization(self) -> None:
        """Test tag node model serialization to dict."""
        child = TagNode(name="Child", count=5)  # type: ignore
        parent = TagNode(
            name="Parent",
            children=[child],
            count=1,
        )

        parent_dict = parent.model_dump()

        assert parent_dict == {
            "name": "Parent",
            "children": [{"name": "Child", "children": [], "count": 5, "level": 0, "hierarchy_path": ""}],
            "count": 1,
            "level": 0,
            "hierarchy_path": ""
        }

    def test_tag_node_empty_children_list(self) -> None:
        """Test creating a tag node with empty children list."""
        tag = TagNode(name="Empty Parent", children=[])  # type: ignore

        assert tag.name == "Empty Parent"
        assert tag.children == []
        assert tag.count == 0  # Now defaults to 0
