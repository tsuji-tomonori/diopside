import useSWR from 'swr'
import { ApiClient } from '@/lib/api'
import { useConfig } from '@/contexts/ConfigContext'
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
  const { config, isLoading: configLoading } = useConfig()

  const key = lastKey
    ? `videos-${year}-${limit}-${lastKey}`
    : `videos-${year}-${limit}`

  return useSWR<VideosResponse>(
    config && !configLoading ? key : null,
    () => config ? ApiClient.getVideosByYear(config.NEXT_PUBLIC_API_URL, year, limit, lastKey) : Promise.reject('Config not loaded'),
    swrConfig
  )
}

/**
 * Hook to fetch tag tree
 */
export function useTagTree() {
  const { config, isLoading: configLoading } = useConfig()

  return useSWR<TagsResponse>(
    config && !configLoading ? 'tag-tree' : null,
    () => config ? ApiClient.getTagTree(config.NEXT_PUBLIC_API_URL) : Promise.reject('Config not loaded'),
    swrConfig
  )
}

/**
 * Hook to fetch videos by tag path
 */
export function useVideosByTag(tagPath: string) {
  const { config, isLoading: configLoading } = useConfig()

  return useSWR<VideosByTagResponse>(
    config && !configLoading && tagPath ? `videos-by-tag-${tagPath}` : null,
    () => config ? ApiClient.getVideosByTag(config.NEXT_PUBLIC_API_URL, tagPath) : Promise.reject('Config not loaded'),
    swrConfig
  )
}

/**
 * Hook to fetch random videos
 */
export function useRandomVideos(count: number = 1) {
  const { config, isLoading: configLoading } = useConfig()

  return useSWR<RandomVideosResponse>(
    config && !configLoading ? `random-videos-${count}` : null,
    () => config ? ApiClient.getRandomVideos(config.NEXT_PUBLIC_API_URL, count) : Promise.reject('Config not loaded'),
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
  const { config, isLoading: configLoading } = useConfig()

  return useSWR<MemoryThumbnailsResponse>(
    config && !configLoading ? `memory-thumbnails-${pairs}` : null,
    () => config ? ApiClient.getMemoryThumbnails(config.NEXT_PUBLIC_API_URL, pairs) : Promise.reject('Config not loaded'),
    swrConfig
  )
}

/**
 * Hook to fetch single video by ID
 */
export function useVideo(videoId: string) {
  const { config, isLoading: configLoading } = useConfig()

  return useSWR<Video>(
    config && !configLoading && videoId ? `video-${videoId}` : null,
    () => config ? ApiClient.getVideoById(config.NEXT_PUBLIC_API_URL, videoId) : Promise.reject('Config not loaded'),
    swrConfig
  )
}
