"""Tests for DynamoDB service - Unit tests without mocking."""

import pytest

from app.services import DynamoDBService


class TestDynamoDBService:
    """Test cases for DynamoDB service."""

    def test_tags_match_path_exact_match(self) -> None:
        """Test tag path matching with exact match."""
        service = DynamoDBService()
        item_tags = ["ゲーム実況", "ホラー", "Cry of Fear"]
        path_tags = ["ゲーム実況", "ホラー"]
        
        assert service._tags_match_path(item_tags, path_tags) is True

    def test_tags_match_path_no_match(self) -> None:
        """Test tag path matching with no match."""
        service = DynamoDBService()
        item_tags = ["ゲーム実況", "アクション"]
        path_tags = ["ゲーム実況", "ホラー"]
        
        assert service._tags_match_path(item_tags, path_tags) is False

    def test_tags_match_path_empty_path(self) -> None:
        """Test tag path matching with empty path."""
        service = DynamoDBService()
        item_tags = ["ゲーム実況", "ホラー"]
        path_tags: list[str] = []
        
        assert service._tags_match_path(item_tags, path_tags) is True

    def test_tags_match_path_partial_match(self) -> None:
        """Test tag path matching with partial match."""
        service = DynamoDBService()
        item_tags = ["ゲーム実況", "ホラー", "Cry of Fear"]
        path_tags = ["ゲーム実況", "ホラー", "Cry of Fear"]
        
        assert service._tags_match_path(item_tags, path_tags) is True

    def test_tags_match_path_longer_path_than_item(self) -> None:
        """Test tag path matching when path is longer than item tags."""
        service = DynamoDBService()
        item_tags = ["ゲーム実況"]
        path_tags = ["ゲーム実況", "ホラー", "Cry of Fear"]
        
        assert service._tags_match_path(item_tags, path_tags) is False

    def test_add_tags_to_tree(self) -> None:
        """Test adding tags to tree structure."""
        service = DynamoDBService()
        tree: dict[str, dict] = {}
        tags = ["ゲーム実況", "ホラー", "Cry of Fear"]
        
        service._add_tags_to_tree(tree, tags)
        
        assert "ゲーム実況" in tree
        assert tree["ゲーム実況"]["count"] == 1
        assert "ホラー" in tree["ゲーム実況"]["children"]
        assert tree["ゲーム実況"]["children"]["ホラー"]["count"] == 1
        assert "Cry of Fear" in tree["ゲーム実況"]["children"]["ホラー"]["children"]

    def test_dict_to_tag_nodes(self) -> None:
        """Test converting dictionary to TagNode objects."""
        service = DynamoDBService()
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
        assert nodes[0].children is not None
        assert len(nodes[0].children) == 2
        
        # Check children are sorted
        child_names = [child.name for child in nodes[0].children]
        assert child_names == ["アクション", "ホラー"]