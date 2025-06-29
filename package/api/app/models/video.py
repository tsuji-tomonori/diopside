from pydantic import BaseModel, Field


class Video(BaseModel):
    """Video model representing a VTuber archive."""

    video_id: str = Field(..., description="YouTube video ID")
    title: str = Field(..., description="Video title")
    tags: list[str] = Field(default_factory=list, description="Hierarchical tags")
    year: int = Field(..., description="Archive publication year")
    thumbnail_url: str | None = Field(None, description="Thumbnail image URL")
    created_at: str | None = Field(None, description="Creation timestamp (ISO8601)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "video_id": "dQw4w9WgXcQ",
                "title": "【ホラーゲーム】Cry of Fear 実況プレイ #1",
                "tags": ["ゲーム実況", "ホラー", "Cry of Fear"],
                "year": 2023,
                "thumbnail_url": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
                "created_at": "2023-10-15T14:30:00Z",
            }
        }
    }


class TagNode(BaseModel):
    """Tag hierarchy node for building tag trees."""

    name: str = Field(..., description="Tag name")
    children: list["TagNode"] = Field(default_factory=list, description="Child tag nodes")
    count: int = Field(default=0, description="Number of videos under this tag")
    level: int = Field(default=0, description="Hierarchy level (0=root, 1=category, etc.)")
    hierarchy_path: str = Field(default="", description="Full hierarchy path (e.g., 'ゲーム実況/ホラー')")

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "ゲーム実況",
                "children": [
                    {
                        "name": "ホラー",
                        "children": [{"name": "Cry of Fear", "count": 5, "level": 2, "hierarchy_path": "ゲーム実況/ホラー/Cry of Fear"}],
                        "count": 15,
                        "level": 1,
                        "hierarchy_path": "ゲーム実況/ホラー"
                    }
                ],
                "count": 25,
                "level": 0,
                "hierarchy_path": "ゲーム実況"
            }
        }
    }


class TagMapping(BaseModel):
    """Represents a tag mapping with confidence and rule information."""

    original: str = Field(..., description="Original tag")
    hierarchy_path: str = Field(..., description="Hierarchical path for the tag")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence level (0.0-1.0)")
    rule_applied: str = Field(..., description="Name of the rule that was applied")

    model_config = {
        "json_schema_extra": {
            "example": {
                "original": "Cry of Fear",
                "hierarchy_path": "ゲーム実況/ホラー/Cry of Fear",
                "confidence": 0.95,
                "rule_applied": "game_name_rule"
            }
        }
    }


class TagNormalizeRequest(BaseModel):
    """Request model for tag normalization."""

    tags: list[str] = Field(..., description="List of flat tags to normalize")

    model_config = {
        "json_schema_extra": {
            "example": {
                "tags": ["ゲーム実況", "ホラー", "Cry of Fear"]
            }
        }
    }


class TagNormalizeResponse(BaseModel):
    """Response model for tag normalization."""

    original_tags: list[str] = Field(..., description="Original input tags")
    hierarchical_tags: list[str] = Field(..., description="Normalized hierarchical tags")
    mapping_details: list[TagMapping] = Field(..., description="Detailed mapping information")

    model_config = {
        "json_schema_extra": {
            "example": {
                "original_tags": ["ゲーム実況", "ホラー", "Cry of Fear"],
                "hierarchical_tags": ["ゲーム実況/ホラー/Cry of Fear"],
                "mapping_details": [
                    {
                        "original": "Cry of Fear",
                        "hierarchy_path": "ゲーム実況/ホラー/Cry of Fear",
                        "confidence": 0.95,
                        "rule_applied": "game_name_rule"
                    }
                ]
            }
        }
    }


class TagTreeResponse(BaseModel):
    """Response model for tag tree API."""

    tag_tree: list[TagNode] = Field(..., description="Hierarchical tag tree")
    metadata: dict = Field(..., description="Additional metadata about the tag tree")

    model_config = {
        "json_schema_extra": {
            "example": {
                "tag_tree": [
                    {
                        "name": "ゲーム実況",
                        "children": [],
                        "count": 100,
                        "level": 0,
                        "hierarchy_path": "ゲーム実況"
                    }
                ],
                "metadata": {
                    "total_videos": 500,
                    "hierarchy_coverage": 0.85,
                    "last_updated": "2024-01-01T12:00:00Z"
                }
            }
        }
    }


class VideosByTagResponse(BaseModel):
    """Response model for videos by tag API."""

    videos: list[Video] = Field(..., description="List of videos matching the tag")
    pagination: dict = Field(..., description="Pagination information")
    tag_info: dict = Field(..., description="Information about the queried tag")

    model_config = {
        "json_schema_extra": {
            "example": {
                "videos": [],
                "pagination": {
                    "page": 1,
                    "limit": 20,
                    "total": 50,
                    "has_next": True
                },
                "tag_info": {
                    "hierarchy_path": "ゲーム実況/ホラー",
                    "level": 1,
                    "parent_path": "ゲーム実況",
                    "children_paths": ["ゲーム実況/ホラー/Cry of Fear"]
                }
            }
        }
    }


# Enable forward references for TagNode
TagNode.model_rebuild()
