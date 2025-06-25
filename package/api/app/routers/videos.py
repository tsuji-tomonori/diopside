import os

from fastapi import APIRouter, HTTPException, Query
from models.video import TagNode, Video  # type: ignore
from pydantic import BaseModel
from services.dynamodb_service import DynamoDBService  # type: ignore

router = APIRouter(prefix="/api", tags=["videos"])

# Initialize DynamoDB service
db_service = DynamoDBService(
    os.getenv("DYNAMODB_TABLE_NAME", "videos"),
    os.getenv("CHAT_TABLE_NAME", "chat")
)


@router.get("/health")
async def api_health_check() -> dict[str, str]:
    """API health check endpoint."""
    return {"status": "healthy", "api": "operational"}


class VideosResponse(BaseModel):
    """Response model for paginated videos."""

    items: list[Video]
    last_key: str | None = None


class TagsResponse(BaseModel):
    """Response model for tag tree."""

    tree: list[TagNode]


class VideosByTagResponse(BaseModel):
    """Response model for videos filtered by tag."""

    items: list[Video]


class RandomVideosResponse(BaseModel):
    """Response model for random videos."""

    items: list[Video]


class MemoryThumbnailsResponse(BaseModel):
    """Response model for memory game thumbnails."""

    thumbnails: list[str]


@router.get("/videos", response_model=VideosResponse)
async def get_videos_by_year(
    year: int = Query(..., description="Year to filter videos (YYYY format)"),
    limit: int = Query(
        50, ge=1, le=100, description="Maximum number of videos to return"
    ),
    last_key: str | None = Query(None, description="Last key for pagination"),
) -> VideosResponse:
    """Get videos by year with pagination support.

    This endpoint supports infinite scroll by using the lastKey parameter
    for pagination through large result sets.
    """
    try:
        videos, next_last_key = await db_service.get_videos_by_year(
            year=year,
            limit=limit,
            last_key=last_key,
        )

        return VideosResponse(items=videos, last_key=next_last_key)

    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/tags", response_model=TagsResponse)
async def get_tag_tree() -> TagsResponse:
    """Get hierarchical tag tree structure.

    Returns a tree structure of all tags with their counts,
    enabling hierarchical navigation through video archives.
    """
    try:
        tag_tree = await db_service.build_tag_tree()
        return TagsResponse(tree=tag_tree)

    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/videos/by-tag", response_model=VideosByTagResponse)
async def get_videos_by_tag(
    path: str = Query(
        ..., description="Tag path (e.g., 'ゲーム実況/ホラー/Cry of Fear')"
    ),
) -> VideosByTagResponse:
    """Get videos filtered by hierarchical tag path.

    Supports filtering videos by a specific tag path in the hierarchy.
    The path should be slash-separated (e.g., 'ゲーム実況/ホラー/Cry of Fear').
    """
    try:
        videos = await db_service.get_videos_by_tag_path(path)
        return VideosByTagResponse(items=videos)

    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/videos/random", response_model=RandomVideosResponse)
async def get_random_videos(
    count: int = Query(1, ge=1, le=20, description="Number of random videos to return"),
) -> RandomVideosResponse:
    """Get random videos for discovery.

    Returns a random selection of videos for the random discovery feature.
    """
    try:
        videos = await db_service.get_random_videos(count)
        return RandomVideosResponse(items=videos)

    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/videos/memory", response_model=MemoryThumbnailsResponse)
async def get_memory_thumbnails(
    pairs: int = Query(8, ge=2, le=20, description="Number of pairs for memory game"),
) -> MemoryThumbnailsResponse:
    """Get thumbnail pairs for memory game.

    Returns thumbnail URLs arranged in pairs for the memory game feature.
    Each thumbnail appears exactly twice in the returned array.
    """
    try:
        thumbnails = await db_service.get_memory_thumbnails(pairs)
        return MemoryThumbnailsResponse(thumbnails=thumbnails)

    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/videos/{video_id}", response_model=Video)
async def get_video_by_id(
    video_id: str,
) -> Video:
    """Get a single video by its ID.

    Returns detailed information about a specific video.
    """
    try:
        video = await db_service.get_video_by_id(video_id)

        if not video:
            raise HTTPException(status_code=404, detail="Video not found")

        return video

    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


class ChatVectorResponse(BaseModel):
    """Response model for chat word vectors and related videos."""

    word_vector: dict[str, int]
    related_videos: list[str]


@router.get("/videos/{video_id}/chat", response_model=ChatVectorResponse)
async def get_video_chat_vector(video_id: str) -> ChatVectorResponse:
    """Get word frequency vector and related videos for a video."""
    try:
        vector = await db_service.get_chat_vector(video_id)
        if vector is None:
            raise HTTPException(status_code=404, detail="Vector not found")
        related = await db_service.get_related_videos(video_id)
        return ChatVectorResponse(word_vector=vector, related_videos=related)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
