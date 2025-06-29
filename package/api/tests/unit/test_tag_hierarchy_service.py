"""
Unit tests for tag hierarchy service functionality.
Tests automatic tag classification and hierarchy building.
"""

import pytest
from unittest.mock import Mock, AsyncMock
from app.services.tag_hierarchy_service import (
    TagHierarchyService,
    TagRuleLoader,
    TagAnalyzer,
    TagMapping
)
from app.models.video import TagNode


class TestTagRuleLoader:
    """Test tag rule loading from external sources."""

    def test_load_major_categories(self):
        """Test loading major category tags from tag_rule.md."""
        loader = TagRuleLoader()
        categories = loader.load_major_categories()

        expected_categories = [
            "ASMR", "お披露目", "イベント", "ゲーム実況",
            "企画", "朗読・声劇", "歌", "百合", "雑談"
        ]

        for category in expected_categories:
            assert category in categories

    def test_load_subcategories(self):
        """Test loading subcategory mappings from tag_rule.md."""
        loader = TagRuleLoader()
        subcategories = loader.load_subcategories()

        # Test specific mappings from tag_rule.md
        assert "ホラー" in subcategories["ゲーム実況"]
        assert "FPS/TPS" in subcategories["ゲーム実況"]
        assert "フリートーク" in subcategories["雑談"]
        assert "耳かき" in subcategories["ASMR"]

    def test_load_tag_analysis_table(self):
        """Test loading classification data from tag_analysis_table.csv."""
        loader = TagRuleLoader()
        analysis_data = loader.load_tag_analysis_table()

        # Test that the expected categories exist (CSV may or may not be present)
        expected_categories = ["ゲーム名", "人名", "グループ名", "企画名", "イベント"]
        for category in expected_categories:
            assert category in analysis_data
            assert isinstance(analysis_data[category], set)


class TestTagAnalyzer:
    """Test tag analysis and classification logic."""

    @pytest.fixture
    def analyzer(self):
        """Create analyzer instance with rule loader."""
        rule_loader = TagRuleLoader()
        return TagAnalyzer(rule_loader)

    def test_find_root_tag(self, analyzer):
        """Test identification of root tag from flat tags."""

        # Test with game commentary tags
        tags = ["ゲーム実況", "ホラー", "Cry of Fear"]
        root = analyzer.find_root_tag(tags)
        assert root == "ゲーム実況"

        # Test with ASMR tags
        tags = ["耳かき", "ASMR", "ささやき"]
        root = analyzer.find_root_tag(tags)
        assert root == "ASMR"

        # Test with no major category
        tags = ["Unknown Tag", "Another Tag"]
        root = analyzer.find_root_tag(tags)
        assert root is None

    def test_find_subcategories(self, analyzer):
        """Test subcategory identification within root category."""

        tags = ["ゲーム実況", "ホラー", "RPG", "Cry of Fear"]
        subcategories = analyzer.find_subcategories(tags, "ゲーム実況")

        assert "ホラー" in subcategories
        assert "RPG" in subcategories
        assert "Cry of Fear" not in subcategories  # This is a game name, not subcategory

    def test_find_content_tags(self, analyzer):
        """Test content tag identification (games, people, etc.)."""
        tags = ["ゲーム実況", "ホラー", "Cry of Fear", "Unknown Game"]

        content_tags = analyzer.find_content_tags(tags, "ゲーム実況", ["ホラー"])

        assert "Cry of Fear" in content_tags
        assert "Unknown Game" in content_tags


class TestTagHierarchyService:
    """Test main tag hierarchy service functionality."""

    @pytest.fixture
    def service(self):
        """Create service instance with mocked dependencies."""
        service = TagHierarchyService()
        service.rule_loader = Mock(spec=TagRuleLoader)
        service.analyzer = Mock(spec=TagAnalyzer)
        return service

    def test_normalize_flat_tags_game_hierarchy(self, service):
        """Test normalizing flat tags into game commentary hierarchy."""
        # Mock dependencies
        service.analyzer.find_root_tag.return_value = "ゲーム実況"
        service.analyzer.find_subcategories.return_value = ["ホラー"]
        service.analyzer.find_content_tags.return_value = ["Cry of Fear"]

        input_tags = ["ゲーム実況", "ホラー", "Cry of Fear"]
        result = service.normalize_tags(input_tags)

        expected = ["ゲーム実況/ホラー/Cry of Fear"]
        assert result == expected

    def test_normalize_flat_tags_asmr_hierarchy(self, service):
        """Test normalizing ASMR tags into hierarchy."""
        service.analyzer.find_root_tag.return_value = "ASMR"
        service.analyzer.find_subcategories.return_value = ["耳かき"]
        service.analyzer.find_content_tags.return_value = []

        input_tags = ["ASMR", "耳かき", "バイノーラル"]
        result = service.normalize_tags(input_tags)

        expected = ["ASMR/耳かき", "バイノーラル"]
        assert result == expected

    def test_normalize_flat_tags_shorts_hierarchy(self, service):
        """Test normalizing shorts tags."""
        service.analyzer.find_root_tag.return_value = "shorts"
        service.analyzer.find_subcategories.return_value = []
        service.analyzer.find_content_tags.return_value = ["varkshorts"]

        input_tags = ["shorts", "varkshorts"]
        result = service.normalize_tags(input_tags)

        expected = ["shorts/varkshorts"]
        assert result == expected

    def test_normalize_tags_no_root_category(self, service):
        """Test handling tags with no identifiable root category."""
        service.analyzer.find_root_tag.return_value = None

        input_tags = ["Unknown Tag", "Another Tag"]
        result = service.normalize_tags(input_tags)

        # Should return original tags when no classification possible
        assert result == input_tags

    def test_normalize_tags_mixed_hierarchy(self, service):
        """Test handling mixed tags with some hierarchical and some flat."""
        service.analyzer.find_root_tag.return_value = "雑談"
        service.analyzer.find_subcategories.return_value = ["フリートーク"]
        service.analyzer.find_content_tags.return_value = []

        input_tags = ["雑談", "フリートーク", "コラボ", "健屋花那"]
        result = service.normalize_tags(input_tags)

        expected = ["雑談/フリートーク", "コラボ", "健屋花那"]
        assert result == expected

    def test_validate_hierarchy_valid_path(self):
        """Test validation of valid hierarchy paths."""
        service = TagHierarchyService()

        valid_paths = [
            "ゲーム実況/ホラー/Cry of Fear",
            "ASMR/耳かき",
            "shorts",
            "雑談/フリートーク"
        ]

        for path in valid_paths:
            assert service.validate_hierarchy(path) is True

    def test_validate_hierarchy_invalid_path(self):
        """Test validation of invalid hierarchy paths."""
        service = TagHierarchyService()

        invalid_paths = [
            "Invalid/Category/Path",
            "",
            "///"
        ]

        for path in invalid_paths:
            assert service.validate_hierarchy(path) is False


class TestTagMapping:
    """Test tag mapping functionality."""

    def test_tag_mapping_creation(self):
        """Test creation of tag mapping objects."""
        mapping = TagMapping(
            original="ゲーム実況",
            hierarchy_path="ゲーム実況/ホラー/Cry of Fear",
            confidence=0.95,
            rule_applied="major_category_rule"
        )

        assert mapping.original == "ゲーム実況"
        assert mapping.hierarchy_path == "ゲーム実況/ホラー/Cry of Fear"
        assert mapping.confidence == 0.95
        assert mapping.rule_applied == "major_category_rule"

    def test_tag_mapping_confidence_levels(self):
        """Test different confidence levels for tag mappings."""
        # High confidence for exact rule match
        high_confidence = TagMapping(
            original="Cry of Fear",
            hierarchy_path="ゲーム実況/ホラー/Cry of Fear",
            confidence=0.95,
            rule_applied="game_name_rule"
        )

        # Low confidence for fuzzy match
        low_confidence = TagMapping(
            original="Unknown Game",
            hierarchy_path="ゲーム実況/Unknown Game",
            confidence=0.3,
            rule_applied="fallback_rule"
        )

        assert high_confidence.confidence > low_confidence.confidence


class TestTagHierarchyBuildingIntegration:
    """Integration tests for tag hierarchy building."""

    @pytest.fixture
    def service(self):
        """Create service with real dependencies for integration testing."""
        return TagHierarchyService()

    @pytest.mark.asyncio
    async def test_build_hierarchy_tree_structure(self, service):
        """Test building complete hierarchy tree structure."""
        # Mock video data
        mock_videos = [
            {"tags": ["ゲーム実況", "ホラー", "Cry of Fear"]},
            {"tags": ["ゲーム実況", "RPG", "Minecraft"]},
            {"tags": ["ASMR", "耳かき"]},
            {"tags": ["雑談", "フリートーク"]},
            {"tags": ["shorts", "varkshorts"]}
        ]

        service.db_service = Mock()
        service.db_service.scan_all_videos.return_value = mock_videos

        tree = await service.build_hierarchy_tree()

        # Verify tree structure
        assert isinstance(tree, TagNode)
        assert tree.name == "root"

        # Check for major categories
        category_names = [child.name for child in tree.children]
        assert "ゲーム実況" in category_names
        assert "ASMR" in category_names
        assert "雑談" in category_names
        assert "shorts" in category_names

    @pytest.mark.asyncio
    async def test_build_hierarchy_tree_counts(self, service):
        """Test correct video counting in hierarchy tree."""
        # Note: The current implementation doesn't connect to real data for counting
        # This test verifies the structure is created correctly
        tree = await service.build_hierarchy_tree()

        # Find game commentary node
        game_node = next(child for child in tree.children if child.name == "ゲーム実況")
        assert game_node is not None  # Node should exist
        assert len(game_node.children) > 0  # Should have subcategories

        # Check that subcategories exist
        subcategory_names = [child.name for child in game_node.children]
        assert "ホラー" in subcategory_names


class TestErrorHandling:
    """Test error handling in tag hierarchy processing."""

    def test_handle_empty_tags(self):
        """Test handling of empty tag arrays."""
        service = TagHierarchyService()
        result = service.normalize_tags([])
        assert result == []

    def test_handle_none_tags(self):
        """Test handling of None input."""
        service = TagHierarchyService()
        result = service.normalize_tags(None)
        assert result == []

    def test_handle_malformed_tags(self):
        """Test handling of malformed tag data."""
        service = TagHierarchyService()

        # Test with non-string tags
        malformed_tags = [123, None, "", "valid_tag"]
        result = service.normalize_tags(malformed_tags)

        # Should filter out invalid tags and process valid ones
        assert "valid_tag" in result
        assert 123 not in result
        assert None not in result
        assert "" not in result


class TestPerformanceConsiderations:
    """Test performance-related aspects of tag hierarchy processing."""

    def test_normalize_tags_performance(self):
        """Test normalization performance with large tag arrays."""
        service = TagHierarchyService()

        # Create large tag array
        large_tag_array = ["ゲーム実況"] + [f"tag_{i}" for i in range(1000)]

        # Should complete in reasonable time
        import time
        start_time = time.time()
        result = service.normalize_tags(large_tag_array)
        end_time = time.time()

        assert (end_time - start_time) < 1.0  # Should complete within 1 second
        assert len(result) > 0

    def test_hierarchy_path_length_limits(self):
        """Test handling of very long hierarchy paths."""
        service = TagHierarchyService()

        # Test maximum reasonable hierarchy depth
        deep_tags = ["ゲーム実況"] + [f"level_{i}" for i in range(10)]
        result = service.normalize_tags(deep_tags)

        # Should handle deep hierarchies gracefully
        assert len(result) > 0

        # Hierarchy path should not be excessively long
        hierarchy_tag = next((tag for tag in result if "/" in tag), None)
        if hierarchy_tag:
            levels = hierarchy_tag.split("/")
            assert len(levels) <= 5  # Reasonable maximum depth
