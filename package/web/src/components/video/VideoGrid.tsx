'use client'

import { useEffect, useRef, useCallback } from 'react'
import { VideoCard } from './VideoCard'
import { Loading } from '@/components/common/Loading'
import type { Video } from '@/types/api'

interface VideoGridProps {
  videos: Video[]
  loading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  onVideoClick?: (video: Video) => void
  className?: string
}

export function VideoGrid({
  videos,
  loading = false,
  hasMore = false,
  onLoadMore,
  onVideoClick,
  className
}: VideoGridProps) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Infinite scroll implementation
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries
    if (target.isIntersecting && hasMore && !loading && onLoadMore) {
      onLoadMore()
    }
  }, [hasMore, loading, onLoadMore])

  useEffect(() => {
    const element = loadMoreRef.current
    if (!element) return

    observerRef.current = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    })

    observerRef.current.observe(element)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [handleObserver])

  if (videos.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          動画が見つかりませんでした
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {videos.map((video) => (
          <VideoCard
            key={video.video_id}
            video={video}
            onClick={onVideoClick}
          />
        ))}
      </div>

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="mt-8">
          {loading && <Loading label="さらに読み込み中..." />}
        </div>
      )}

      {/* Initial loading */}
      {loading && videos.length === 0 && (
        <Loading label="動画を読み込み中..." />
      )}
    </div>
  )
}
