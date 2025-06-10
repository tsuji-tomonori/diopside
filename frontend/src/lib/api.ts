/**
 * API Client for Diopside backend
 */

import type {
  Video,
  VideosResponse,
  TagsResponse,
  VideosByTagResponse,
  RandomVideosResponse,
  MemoryThumbnailsResponse,
  HealthResponse,
  ApiError,
} from '@/types/api'

// Default API base URL - can be overridden via environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * Custom error class for API errors
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: Response
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      
      try {
        const errorData: ApiError = await response.json()
        errorMessage = errorData.detail || errorMessage
      } catch {
        // If we can't parse the error response, use the default message
      }
      
      throw new ApiClientError(errorMessage, response.status, response)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error
    }
    
    // Network or other errors
    throw new ApiClientError(
      `Failed to fetch ${endpoint}: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * API Client class with all endpoint methods
 */
export class ApiClient {
  /**
   * Get videos by year with pagination
   */
  static async getVideosByYear(
    year: number,
    limit: number = 50,
    lastKey?: string
  ): Promise<VideosResponse> {
    const params = new URLSearchParams({
      year: year.toString(),
      limit: limit.toString(),
    })
    
    if (lastKey) {
      params.append('last_key', lastKey)
    }
    
    return apiFetch<VideosResponse>(`/api/videos?${params}`)
  }

  /**
   * Get hierarchical tag tree
   */
  static async getTagTree(): Promise<TagsResponse> {
    return apiFetch<TagsResponse>('/api/tags')
  }

  /**
   * Get videos by tag path
   */
  static async getVideosByTag(tagPath: string): Promise<VideosByTagResponse> {
    const params = new URLSearchParams({
      path: tagPath,
    })
    
    return apiFetch<VideosByTagResponse>(`/api/videos/by-tag?${params}`)
  }

  /**
   * Get random videos
   */
  static async getRandomVideos(count: number = 1): Promise<RandomVideosResponse> {
    const params = new URLSearchParams({
      count: count.toString(),
    })
    
    return apiFetch<RandomVideosResponse>(`/api/videos/random?${params}`)
  }

  /**
   * Get memory game thumbnails
   */
  static async getMemoryThumbnails(pairs: number = 8): Promise<MemoryThumbnailsResponse> {
    const params = new URLSearchParams({
      pairs: pairs.toString(),
    })
    
    return apiFetch<MemoryThumbnailsResponse>(`/api/videos/memory?${params}`)
  }

  /**
   * Get single video by ID
   */
  static async getVideoById(videoId: string): Promise<Video> {
    return apiFetch<Video>(`/api/videos/${encodeURIComponent(videoId)}`)
  }

  /**
   * Health check endpoint
   */
  static async healthCheck(): Promise<HealthResponse> {
    return apiFetch<HealthResponse>('/health')
  }

  /**
   * Root endpoint
   */
  static async getRoot(): Promise<{ message: string; status: string }> {
    return apiFetch<{ message: string; status: string }>('/')
  }
}

export default ApiClient