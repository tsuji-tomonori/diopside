// API response types based on backend implementation

export interface Video {
  video_id: string
  title: string
  tags: string[]
  year: number
  thumbnail_url?: string
  created_at?: string
}

export interface TagNode {
  name: string
  children?: TagNode[]
  count?: number
}

export interface VideosResponse {
  items: Video[]
  last_key?: string
}

export interface TagsResponse {
  tree: TagNode[]
}

export interface VideosByTagResponse {
  items: Video[]
}

export interface RandomVideosResponse {
  items: Video[]
}

export interface MemoryThumbnailsResponse {
  thumbnails: string[]
}

export interface HealthResponse {
  status: string
  service?: string
}

export interface ApiError {
  detail: string
}
