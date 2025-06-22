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
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
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
        // ignore JSON parsing errors
      }

      throw new ApiClientError(errorMessage, response.status, response)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error
    }

    throw new ApiClientError(
      `Failed to fetch ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`
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
    baseUrl: string,
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

    return apiFetch<VideosResponse>(`${baseUrl}/api/videos?${params}`)
  }

  /**
   * Get hierarchical tag tree
   */
  static async getTagTree(baseUrl: string): Promise<TagsResponse> {
    return apiFetch<TagsResponse>(`${baseUrl}/api/tags`)
  }

  /**
   * Get videos by tag path
   */
  static async getVideosByTag(baseUrl: string, tagPath: string): Promise<VideosByTagResponse> {
    const params = new URLSearchParams({
      path: tagPath,
    })

    return apiFetch<VideosByTagResponse>(`${baseUrl}/api/videos/by-tag?${params}`)
  }

  /**
   * Get random videos
   */
  static async getRandomVideos(baseUrl: string, count: number = 1): Promise<RandomVideosResponse> {
    const params = new URLSearchParams({
      count: count.toString(),
    })

    return apiFetch<RandomVideosResponse>(`${baseUrl}/api/videos/random?${params}`)
  }

  /**
   * Get memory game thumbnails
   */
  static async getMemoryThumbnails(baseUrl: string, pairs: number = 8): Promise<MemoryThumbnailsResponse> {
    const params = new URLSearchParams({
      pairs: pairs.toString(),
    })

    return apiFetch<MemoryThumbnailsResponse>(`${baseUrl}/api/videos/memory?${params}`)
  }

  /**
   * Get single video by ID
   */
  static async getVideoById(baseUrl: string, videoId: string): Promise<Video> {
    return apiFetch<Video>(`${baseUrl}/api/videos/${encodeURIComponent(videoId)}`)
  }

  /**
   * Health check endpoint
   */
  static async healthCheck(baseUrl: string): Promise<HealthResponse> {
    return apiFetch<HealthResponse>(`${baseUrl}/health`)
  }

  /**
   * Root endpoint
   */
  static async getRoot(baseUrl: string): Promise<{ message: string; status: string }> {
    return apiFetch<{ message: string; status: string }>(`${baseUrl}/`)
  }
}

export default ApiClient
