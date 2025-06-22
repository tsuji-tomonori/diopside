"""DynamoDB service for video data operations."""

import json
import random
from decimal import Decimal
from typing import Any, cast

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from models.video import TagNode, Video  # type: ignore


class DecimalEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle DynamoDB Decimal objects."""

    def default(self, obj: Any) -> Any:
        """Convert Decimal objects to int or float for JSON serialization.

        Args:
            obj: Object to encode

        Returns:
            JSON serializable object
        """
        if isinstance(obj, Decimal):
            # Convert to int if it's a whole number, otherwise to float
            if obj % 1 == 0:
                return int(obj)
            else:
                return float(obj)
        return super().default(obj)


class DynamoDBService:
    """Service class for DynamoDB operations."""

    def __init__(self, table_name: str) -> None:
        """Initialize DynamoDB service.

        Args:
            table_name: Name of the DynamoDB table
        """
        self.table_name = table_name
        self.dynamodb = boto3.resource("dynamodb")
        self.table = self.dynamodb.Table(table_name)

    def _convert_dynamodb_item_to_video(self, item: dict[str, Any]) -> Video:
        """Convert DynamoDB item to Video model.

        Args:
            item: DynamoDB item dictionary

        Returns:
            Video model instance
        """
        return Video(
            video_id=str(item["video_id"]),
            title=str(item["title"]),
            tags=cast("list[str]", item.get("tags", [])),
            year=int(item["year"]),
            thumbnail_url=(
                str(item["thumbnail_url"]) if item.get("thumbnail_url") else None
            ),
            created_at=str(item["created_at"]) if item.get("created_at") else None,
        )

    async def get_videos_by_year(
        self,
        year: int,
        limit: int = 50,
        last_key: str | None = None,
    ) -> tuple[list[Video], str | None]:
        """Get videos by year with pagination.

        Args:
            year: Year to filter by
            limit: Maximum number of items to return
            last_key: Last evaluated key for pagination

        Returns:
            Tuple of (videos list, next last_key)
        """
        try:
            query_kwargs: dict[str, Any] = {
                "IndexName": "GSI1",
                "KeyConditionExpression": Key("year").eq(year),
                "Limit": limit,
            }

            if last_key:
                query_kwargs["ExclusiveStartKey"] = json.loads(last_key)

            response = self.table.query(**query_kwargs)

            videos = [
                self._convert_dynamodb_item_to_video(item)
                for item in response.get("Items", [])
            ]

            next_last_key = None
            if "LastEvaluatedKey" in response:
                next_last_key = json.dumps(
                    response["LastEvaluatedKey"], cls=DecimalEncoder
                )

            return videos, next_last_key

        except ClientError as e:
            raise RuntimeError(f"Failed to query videos by year: {e}") from e

    async def get_video_by_id(self, video_id: str) -> Video | None:
        """Get a single video by ID.

        Args:
            video_id: Video ID to retrieve

        Returns:
            Video object or None if not found
        """
        try:
            response = self.table.get_item(Key={"video_id": video_id})

            if "Item" not in response:
                return None

            return self._convert_dynamodb_item_to_video(response["Item"])

        except ClientError as e:
            raise RuntimeError(f"Failed to get video by ID: {e}") from e

    async def get_videos_by_tag_path(self, tag_path: str) -> list[Video]:
        """Get videos that match a specific tag path.

        Args:
            tag_path: Tag path like "ゲーム実況/ホラー/Cry of Fear"

        Returns:
            List of matching videos
        """
        try:
            # Split the tag path into individual tags
            tags = [tag.strip() for tag in tag_path.split("/") if tag.strip()]

            # Scan all items and filter by tag path
            response = self.table.scan()
            videos = []

            for item in response.get("Items", []):
                item_tags = cast("list[str]", item.get("tags", []))

                # Check if all tags in the path exist in the item's tags
                if self._tags_match_path(item_tags, tags):
                    videos.append(self._convert_dynamodb_item_to_video(item))

            return videos

        except ClientError as e:
            raise RuntimeError(f"Failed to get videos by tag path: {e}") from e

    def _tags_match_path(self, item_tags: list[str], path_tags: list[str]) -> bool:
        """Check if item tags match the given path.

        Args:
            item_tags: Tags from the video item
            path_tags: Tags from the search path

        Returns:
            True if all path tags are found in item tags in order
        """
        if not path_tags:
            return True

        # Find the starting position of the path in item tags
        for i in range(len(item_tags) - len(path_tags) + 1):
            if item_tags[i : i + len(path_tags)] == path_tags:
                return True

        return False

    async def get_random_videos(self, count: int = 1) -> list[Video]:
        """Get random videos.

        Args:
            count: Number of random videos to return

        Returns:
            List of random videos
        """
        try:
            # Scan all items (not efficient for large datasets, but works for MVP)
            response = self.table.scan()
            items = response.get("Items", [])

            if not items:
                return []

            # Randomly sample items
            sample_size = min(count, len(items))
            random_items = random.sample(items, sample_size)

            return [self._convert_dynamodb_item_to_video(item) for item in random_items]

        except ClientError as e:
            raise RuntimeError(f"Failed to get random videos: {e}") from e

    async def get_memory_thumbnails(self, pairs: int = 8) -> list[str]:
        """Get thumbnail URLs for memory game.

        Args:
            pairs: Number of pairs (total thumbnails will be pairs * 2)

        Returns:
            List of thumbnail URLs (duplicated for pairs)
        """
        try:
            # Get random videos with thumbnails
            response = self.table.scan()
            items = [
                item for item in response.get("Items", []) if item.get("thumbnail_url")
            ]

            if not items:
                return []

            # Sample unique thumbnails
            sample_size = min(pairs, len(items))
            random_items = random.sample(items, sample_size)

            # Create pairs by duplicating each thumbnail
            thumbnails: list[str] = []
            for item in random_items:
                thumbnail_url = item.get("thumbnail_url")
                if thumbnail_url:
                    thumbnail_str = str(thumbnail_url)
                    thumbnails.extend([thumbnail_str, thumbnail_str])

            # Shuffle the final list
            random.shuffle(thumbnails)

            return thumbnails

        except ClientError as e:
            raise RuntimeError(f"Failed to get memory thumbnails: {e}") from e

    async def build_tag_tree(self) -> list[TagNode]:
        """Build hierarchical tag tree from all videos.

        Returns:
            List of root tag nodes
        """
        try:
            # Scan all items to collect tags
            response = self.table.scan()
            items = response.get("Items", [])

            # Build tag hierarchy
            tag_tree: dict[str, Any] = {}

            for item in items:
                tags = cast("list[str]", item.get("tags", []))
                self._add_tags_to_tree(tag_tree, tags)

            # Convert to TagNode objects
            return self._dict_to_tag_nodes(tag_tree)

        except ClientError as e:
            raise RuntimeError(f"Failed to build tag tree: {e}") from e

    def _add_tags_to_tree(self, tree: dict[str, Any], tags: list[str]) -> None:
        """Add a tag path to the tree structure.

        Args:
            tree: Current tree dictionary
            tags: List of tags representing a path
        """
        current = tree

        for tag in tags:
            if tag not in current:
                current[tag] = {"children": {}, "count": 0}
            current[tag]["count"] += 1
            current = current[tag]["children"]

    def _dict_to_tag_nodes(self, tree: dict[str, Any]) -> list[TagNode]:
        """Convert tree dictionary to TagNode objects.

        Args:
            tree: Tree dictionary structure

        Returns:
            List of TagNode objects
        """
        nodes = []

        for tag_name, tag_data in tree.items():
            children_dict = tag_data["children"]
            children = None

            if children_dict:
                children = self._dict_to_tag_nodes(children_dict)

            node = TagNode(
                name=tag_name,
                children=children,
                count=tag_data["count"],
            )
            nodes.append(node)

        return sorted(nodes, key=lambda x: x.name)
