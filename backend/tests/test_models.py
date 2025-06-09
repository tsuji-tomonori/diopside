"""Tests for data models."""

import pytest
from pydantic import ValidationError

from app.models import TagNode, Video


class TestVideo:
    """Test cases for Video model."""

    def test_video_creation_valid(self) -> None:
        """Test creating a valid video."""
        video = Video(
            video_id="dQw4w9WgXcQ",
            title="Test Video",
            tags=["ゲーム実況", "ホラー"],
            year=2023,
            thumbnail_url="https://example.com/thumb.jpg",
            created_at="2023-10-15T14:30:00Z",
        )
        
        assert video.video_id == "dQw4w9WgXcQ"
        assert video.title == "Test Video"
        assert video.tags == ["ゲーム実況", "ホラー"]
        assert video.year == 2023
        assert video.thumbnail_url == "https://example.com/thumb.jpg"
        assert video.created_at == "2023-10-15T14:30:00Z"

    def test_video_creation_minimal(self) -> None:
        """Test creating a video with minimal required fields."""
        video = Video(
            video_id="test123",
            title="Minimal Video",
            year=2023,
        )
        
        assert video.video_id == "test123"
        assert video.title == "Minimal Video"
        assert video.tags == []
        assert video.year == 2023
        assert video.thumbnail_url is None
        assert video.created_at is None

    def test_video_creation_invalid_missing_required(self) -> None:
        """Test that missing required fields raise validation error."""
        with pytest.raises(ValidationError):
            Video(title="Missing video_id and year")

    def test_video_creation_invalid_year_type(self) -> None:
        """Test that invalid year type raises validation error."""
        with pytest.raises(ValidationError):
            Video(
                video_id="test123",
                title="Invalid Year",
                year="not_a_number",  # type: ignore
            )


class TestTagNode:
    """Test cases for TagNode model."""

    def test_tag_node_creation_simple(self) -> None:
        """Test creating a simple tag node."""
        node = TagNode(name="ゲーム実況", count=5)
        
        assert node.name == "ゲーム実況"
        assert node.count == 5
        assert node.children is None

    def test_tag_node_creation_with_children(self) -> None:
        """Test creating a tag node with children."""
        child_node = TagNode(name="ホラー", count=3)
        parent_node = TagNode(
            name="ゲーム実況",
            children=[child_node],
            count=1,
        )
        
        assert parent_node.name == "ゲーム実況"
        assert parent_node.count == 1
        assert parent_node.children is not None
        assert len(parent_node.children) == 1
        assert parent_node.children[0].name == "ホラー"
        assert parent_node.children[0].count == 3

    def test_tag_node_nested_hierarchy(self) -> None:
        """Test creating a deeply nested tag hierarchy."""
        leaf_node = TagNode(name="Cry of Fear", count=2)
        middle_node = TagNode(name="ホラー", children=[leaf_node], count=1)
        root_node = TagNode(name="ゲーム実況", children=[middle_node], count=1)
        
        assert root_node.name == "ゲーム実況"
        assert root_node.children is not None
        assert root_node.children[0].name == "ホラー"
        assert root_node.children[0].children is not None
        assert root_node.children[0].children[0].name == "Cry of Fear"
        assert root_node.children[0].children[0].count == 2