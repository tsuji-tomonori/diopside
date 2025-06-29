"""
API routes for tag hierarchy functionality.
Provides endpoints for tag normalization and hierarchical operations.
"""

from fastapi import APIRouter, HTTPException
from models.video import (
    TagTreeResponse,
    TagNormalizeRequest,
    TagNormalizeResponse,
    VideosByTagResponse,
    TagMapping as TagMappingModel
)
from services.tag_hierarchy_service import TagHierarchyService, TagMapping
from services.dynamodb_service import DynamoDBService
import os

router = APIRouter(prefix="/api", tags=["tag-hierarchy"])

# Initialize services
hierarchy_service = TagHierarchyService()
db_service = DynamoDBService(os.getenv("DYNAMODB_TABLE_NAME", "videos"))


@router.post("/tags/normalize", response_model=TagNormalizeResponse)
async def normalize_tags(request: TagNormalizeRequest) -> TagNormalizeResponse:
    """Normalize flat tags into hierarchical structure.

    Takes a list of flat tags and returns them organized into
    hierarchical paths with confidence and rule information.
    """
    try:
        # Normalize the tags
        hierarchical_tags = hierarchy_service.normalize_tags(request.tags)

        # Create mapping details (simplified for now)
        mapping_details = []
        for original_tag in request.tags:
            # For now, create basic mappings
            mapping = TagMappingModel(
                original=original_tag,
                hierarchy_path=original_tag,  # Will be enhanced later
                confidence=1.0,
                rule_applied="basic_rule"
            )
            mapping_details.append(mapping)

        return TagNormalizeResponse(
            original_tags=request.tags,
            hierarchical_tags=hierarchical_tags,
            mapping_details=mapping_details
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/tags", response_model=TagTreeResponse)
async def get_tag_tree_enhanced() -> TagTreeResponse:
    """Get hierarchical tag tree with metadata.

    Returns the complete tag hierarchy along with metadata
    about coverage and statistics.
    """
    try:
        # Build the hierarchy tree
        tag_tree = await hierarchy_service.build_hierarchy_tree()

        # Calculate metadata
        # For now, use placeholder values
        metadata = {
            "total_videos": 0,
            "hierarchy_coverage": 0.0,
            "last_updated": "2024-01-01T00:00:00Z"
        }

        return TagTreeResponse(
            tag_tree=[tag_tree],
            metadata=metadata
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/videos/by-tag/{tag_path}", response_model=VideosByTagResponse)
async def get_videos_by_tag_path(tag_path: str) -> VideosByTagResponse:
    """Get videos filtered by hierarchical tag path.

    Supports filtering videos by a specific tag path in the hierarchy.
    The path should be slash-separated (e.g., 'ゲーム実況/ホラー/Cry of Fear').
    """
    try:
        # Get videos by tag path
        videos = await db_service.get_videos_by_tag_path(tag_path)

        # Create pagination info
        pagination = {
            "page": 1,
            "limit": len(videos),
            "total": len(videos),
            "has_next": False
        }

        # Create tag info
        path_parts = tag_path.split("/")
        tag_info = {
            "hierarchy_path": tag_path,
            "level": len(path_parts) - 1,
            "parent_path": "/".join(path_parts[:-1]) if len(path_parts) > 1 else None,
            "children_paths": []  # Will be enhanced later
        }

        return VideosByTagResponse(
            videos=videos,
            pagination=pagination,
            tag_info=tag_info
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
