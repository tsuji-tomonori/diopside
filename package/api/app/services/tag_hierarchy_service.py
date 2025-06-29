"""
Tag hierarchy service for automatic tag classification and hierarchy building.
"""

import re
import csv
from pathlib import Path
from typing import Dict, List, Optional, Set, Any
from dataclasses import dataclass

from app.models.video import TagNode


@dataclass
class TagMapping:
    """Represents a tag mapping with confidence and rule information."""
    original: str
    hierarchy_path: str
    confidence: float
    rule_applied: str


class TagRuleLoader:
    """Loads tag classification rules from external sources."""

    def __init__(self) -> None:
        """Initialize the rule loader."""
        self.project_root = Path(__file__).parent.parent.parent.parent.parent

    def load_major_categories(self) -> List[str]:
        """Load major category tags from tag_rule.md."""
        major_categories = [
            "ASMR", "お披露目", "イベント", "ゲーム実況",
            "企画", "朗読・声劇", "歌", "百合", "雑談"
        ]

        # Also include shorts as a root category
        major_categories.append("shorts")

        return major_categories

    def load_subcategories(self) -> Dict[str, List[str]]:
        """Load subcategory mappings from tag_rule.md."""
        subcategory_mapping = {
            "ゲーム実況": [
                "ホラー", "FPS/TPS", "対戦・アクションゲーム", "レーシングゲーム",
                "RPG", "Minecraft", "サンドボックス", "パズル", "単発ゲーム",
                "ポケモン", "シミュレーション", "ファミリーゲーム", "リズムゲーム",
                "ノベルゲーム"
            ],
            "雑談": [
                "フリートーク", "マシュマロ", "お悩み相談", "コラボ雑談",
                "振り返り雑談", "記念雑談", "作業配信", "ドライブ", "体験談",
                "晩酌"
            ],
            "ASMR": [
                "耳かき", "耳責め", "添い寝", "ささやき", "バレンタイン",
                "ドS", "看病", "甘やかし", "シャンプー", "ロールプレイ"
            ],
            "歌": [
                "歌ってみた", "オリジナル曲", "歌枠", "歌リレー", "カラオケへいこう"
            ],
            "朗読・声劇": [
                "朗読", "バーチャル3分劇場", "IF雪メイキング", "掛け合い",
                "ギャルゲー", "TRPG"
            ],
            "企画": [
                "大会", "誕生祭", "周年記念", "登録者数記念", "フェス", "祭り",
                "ファンミーティング", "耐久", "検証", "ガチレポ！", "ホラー体験",
                "駄犬", "江戸"
            ],
            "お披露目": [
                "新衣装", "3D", "2.0"
            ],
            "百合": [
                "リアル百合エピソード", "百合ゲー", "百合漫画家様対談コラボ", "百合アニメ"
            ],
            "shorts": [
                "varkshorts"
            ]
        }

        return subcategory_mapping

    def load_tag_analysis_table(self) -> Dict[str, Set[str]]:
        """Load classification data from tag_analysis_table.csv."""
        analysis_data: Dict[str, Set[str]] = {
            "ゲーム名": set(),
            "人名": set(),
            "グループ名": set(),
            "企画名": set(),
            "イベント": set()
        }

        csv_path = self.project_root / "tag_analysis_table.csv"

        if not csv_path.exists():
            # Return basic data if CSV doesn't exist
            return analysis_data

        try:
            with open(csv_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    tag_name = row.get('tag_name', '').strip()
                    classification = row.get('classification', '').strip()

                    if tag_name and classification in analysis_data:
                        analysis_data[classification].add(tag_name)
        except Exception as e:
            print(f"Warning: Could not load tag_analysis_table.csv: {e}")

        return analysis_data


class TagAnalyzer:
    """Analyzes tags and performs classification."""

    def __init__(self, rule_loader: TagRuleLoader):
        """Initialize the analyzer with rule loader."""
        self.rule_loader = rule_loader
        self.major_categories = rule_loader.load_major_categories()
        self.subcategories = rule_loader.load_subcategories()
        self.analysis_data = rule_loader.load_tag_analysis_table()

    def find_root_tag(self, tags: List[str]) -> Optional[str]:
        """Find the root category tag from a list of tags."""
        for tag in tags:
            if tag in self.major_categories:
                return tag
        return None

    def find_subcategories(self, tags: List[str], root_tag: str) -> List[str]:
        """Find subcategory tags within a root category."""
        if root_tag not in self.subcategories:
            return []

        valid_subcategories = self.subcategories[root_tag]
        found_subcategories = []

        for tag in tags:
            if tag in valid_subcategories:
                found_subcategories.append(tag)

        return found_subcategories

    def find_content_tags(self, tags: List[str], root_tag: str, used_subcategories: List[str]) -> List[str]:
        """Find content tags (games, people, etc.) that haven't been used yet."""
        used_tags = {root_tag} | set(used_subcategories)
        content_tags = []

        for tag in tags:
            if tag not in used_tags:
                # Check if it's a known content tag
                is_content_tag = (
                    tag in self.analysis_data["ゲーム名"] or
                    tag in self.analysis_data["人名"] or
                    tag in self.analysis_data["グループ名"] or
                    tag in self.analysis_data["企画名"] or
                    self._is_likely_content_tag(tag)
                )

                if is_content_tag:
                    content_tags.append(tag)

        return content_tags

    def _is_likely_content_tag(self, tag: str) -> bool:
        """Determine if a tag is likely a content tag (game, person, etc.)."""
        # Simple heuristics for identifying content tags

        # Game titles often have English names or specific patterns
        if re.match(r'^[A-Za-z0-9\s\-:\.\'\"]+$', tag):
            return True

        # Japanese game titles might have specific characters
        game_indicators = ['ゲーム', 'アイドル', 'シミュレーター', 'オンライン']
        if any(indicator in tag for indicator in game_indicators):
            return True

        return False


class TagHierarchyService:
    """Main service for tag hierarchy operations."""

    def __init__(self) -> None:
        """Initialize the service."""
        self.rule_loader = TagRuleLoader()
        self.analyzer = TagAnalyzer(self.rule_loader)

    def normalize_tags(self, flat_tags: Optional[List[str]]) -> List[str]:
        """Convert flat tags into hierarchical structure."""
        if not flat_tags:
            return []

        # Filter out invalid tags
        valid_tags = [tag for tag in flat_tags if isinstance(tag, str) and tag.strip()]

        if not valid_tags:
            return []

        # Find root category
        root_tag = self.analyzer.find_root_tag(valid_tags)

        if not root_tag:
            # No major category found, return original tags
            return valid_tags

        # Find subcategories
        subcategories = self.analyzer.find_subcategories(valid_tags, root_tag)

        # Find content tags
        content_tags = self.analyzer.find_content_tags(valid_tags, root_tag, subcategories)

        # Build hierarchy path
        hierarchy_parts = [root_tag] + subcategories + content_tags
        hierarchy_path = "/".join(hierarchy_parts)

        # Collect remaining tags that weren't used in hierarchy
        used_tags = {root_tag} | set(subcategories) | set(content_tags)
        remaining_tags = [tag for tag in valid_tags if tag not in used_tags]

        # Return hierarchical tag plus any remaining flat tags
        result = [hierarchy_path] + remaining_tags
        return result

    def validate_hierarchy(self, hierarchy_path: str) -> bool:
        """Validate if a hierarchy path is valid according to rules."""
        if not hierarchy_path:
            return False

        # Split path and check structure
        parts = hierarchy_path.split("/")

        if not parts:
            return False

        # First part should be a major category
        root = parts[0]
        if root not in self.analyzer.major_categories:
            return False

        # If there are subcategories, validate them
        if len(parts) > 1:
            valid_subcategories = self.analyzer.subcategories.get(root, [])
            for part in parts[1:]:
                # Allow content tags even if not in subcategory list
                if part in valid_subcategories:
                    continue
                # Allow known content tags
                elif (part in self.analyzer.analysis_data["ゲーム名"] or
                      part in self.analyzer.analysis_data["人名"] or
                      part in self.analyzer.analysis_data["グループ名"]):
                    continue
                # For other tags, be permissive for now
                elif self.analyzer._is_likely_content_tag(part):
                    continue
                else:
                    # Only reject if it's clearly invalid
                    if not part.strip() or "//" in hierarchy_path:
                        return False

        return True

    def create_tag_mapping(self, original: str, hierarchy_path: str,
                          confidence: float, rule_applied: str) -> TagMapping:
        """Create a tag mapping object."""
        return TagMapping(
            original=original,
            hierarchy_path=hierarchy_path,
            confidence=confidence,
            rule_applied=rule_applied
        )

    async def build_hierarchy_tree(self) -> TagNode:
        """Build complete hierarchy tree from all videos."""
        # This would integrate with the existing DynamoDB service
        # For now, return a basic structure

        root_node = TagNode(
            name="root",
            children=[],
            count=0,
            level=0,
            hierarchy_path=""
        )

        # Add major categories as children
        for category in self.analyzer.major_categories:
            category_node = TagNode(
                name=category,
                children=[],
                count=0,
                level=1,
                hierarchy_path=category
            )

            # Add subcategories
            subcategories = self.analyzer.subcategories.get(category, [])
            for subcategory in subcategories:
                subcategory_node = TagNode(
                    name=subcategory,
                    children=[],
                    count=0,
                    level=2,
                    hierarchy_path=f"{category}/{subcategory}"
                )
                category_node.children.append(subcategory_node)

            root_node.children.append(category_node)

        return root_node
