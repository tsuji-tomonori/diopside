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
    children: list["TagNode"] | None = Field(None, description="Child tag nodes")
    count: int | None = Field(None, description="Number of children or videos")

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "ゲーム実況",
                "children": [
                    {
                        "name": "ホラー",
                        "children": [{"name": "Cry of Fear", "count": 5}],
                        "count": 1,
                    }
                ],
                "count": 1,
            }
        }
    }


# Enable forward references for TagNode
TagNode.model_rebuild()
