'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { YearSelector } from '@/components/year/YearSelector'
import { VideoGrid } from '@/components/video/VideoGrid'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { Loading } from '@/components/common/Loading'
import { useVideosByYear } from '@/hooks/useApi'
import { useConfig } from '@/contexts/ConfigContext'
import type { Video } from '@/types/api'

export default function Home() {
  const router = useRouter()
  const { isLoading: configLoading, error: configError } = useConfig()
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [allVideos, setAllVideos] = useState<Video[]>([])
  const [lastKey, setLastKey] = useState<string | undefined>()

  const { data, error, isLoading, mutate } = useVideosByYear(selectedYear, 50, lastKey)

  // Update videos when data changes
  if (data && data.items.length > 0) {
    const newVideos = data.items.filter(
      video => !allVideos.some(existing => existing.video_id === video.video_id)
    )
    if (newVideos.length > 0) {
      setAllVideos(prev => [...prev, ...newVideos])
    }
  }

  const handleYearChange = (year: number) => {
    setSelectedYear(year)
    setAllVideos([])
    setLastKey(undefined)
  }

  const handleLoadMore = () => {
    if (data?.last_key) {
      setLastKey(data.last_key)
    }
  }

  const handleVideoClick = (video: Video) => {
    router.push(`/video?id=${encodeURIComponent(video.video_id)}`)
  }

  const handleRetry = () => {
    mutate()
  }

  // Show loading while config is loading
  if (configLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loading />
        </div>
      </MainLayout>
    )
  }

  // Show error if config failed to load
  if (configError) {
    return (
      <MainLayout>
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-purple-800 dark:text-purple-200 mb-4">
              白雪巴アーカイブ
            </h1>
            <ErrorMessage
              message="設定の読み込みに失敗しました。ページを再読み込みしてください。"
              onRetry={() => window.location.reload()}
            />
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-purple-800 dark:text-purple-200 mb-4">
            白雪巴アーカイブ
          </h1>
          <p className="text-lg text-purple-600 dark:text-purple-300 mb-8">
            白雪巴さんの動画アーカイブサイト
          </p>

          <div className="max-w-xs mx-auto">
            <YearSelector
              selectedYear={selectedYear}
              onYearChange={handleYearChange}
            />
          </div>
        </div>

        {error && (
          <ErrorMessage
            message="動画の読み込みに失敗しました"
            onRetry={handleRetry}
          />
        )}

        {!error && (
          <VideoGrid
            videos={allVideos}
            loading={isLoading}
            hasMore={!!data?.last_key}
            onLoadMore={handleLoadMore}
            onVideoClick={handleVideoClick}
          />
        )}

        {!isLoading && !error && allVideos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              {selectedYear}年の動画が見つかりませんでした
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
