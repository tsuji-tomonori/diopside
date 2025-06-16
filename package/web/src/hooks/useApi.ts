import useSWR from 'swr'
import { ApiClient } from '@/lib/api'
import type {
  Video,
  VideosResponse,
  TagsResponse,
  VideosByTagResponse,
  RandomVideosResponse,
  MemoryThumbnailsResponse,
} from '@/types/api'

// SWR configuration
const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: 0,
}

/**
 * Hook to fetch videos by year
 */
export function useVideosByYear(year: number, limit: number = 50, lastKey?: string) {
  const key = lastKey 
    ? `videos-${year}-${limit}-${lastKey}` 
    : `videos-${year}-${limit}`
    
  return useSWR<VideosResponse>(
    key,
    () => ApiClient.getVideosByYear(year, limit, lastKey),
    swrConfig
  )
}

/**
 * Hook to fetch tag tree
 */
export function useTagTree() {
  return useSWR<TagsResponse>(
    'tag-tree',
    () => ApiClient.getTagTree(),
    swrConfig
  )
}

/**
 * Hook to fetch videos by tag path
 */
export function useVideosByTag(tagPath: string) {
  return useSWR<VideosByTagResponse>(
    tagPath ? `videos-by-tag-${tagPath}` : null,
    () => ApiClient.getVideosByTag(tagPath),
    swrConfig
  )
}

/**
 * Hook to fetch random videos
 */
export function useRandomVideos(count: number = 1) {
  return useSWR<RandomVideosResponse>(
    `random-videos-${count}`,
    () => ApiClient.getRandomVideos(count),
    {
      ...swrConfig,
      refreshInterval: 30000, // Refresh every 30 seconds for random content
    }
  )
}

/**
 * Hook to fetch memory game thumbnails
 */
export function useMemoryThumbnails(pairs: number = 8) {
  return useSWR<MemoryThumbnailsResponse>(
    `memory-thumbnails-${pairs}`,
    () => ApiClient.getMemoryThumbnails(pairs),
    swrConfig
  )
}

/**
 * Hook to fetch single video by ID
 */
export function useVideo(videoId: string) {
  return useSWR<Video>(
    videoId ? `video-${videoId}` : null,
    () => ApiClient.getVideoById(videoId),
    swrConfig
  )
}