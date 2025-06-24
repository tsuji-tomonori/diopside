'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { VideoCard } from '@/components/video/VideoCard'
import { Loading } from '@/components/common/Loading'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { useRandomVideos } from '@/hooks/useApi'
import { useConfig } from '@/contexts/ConfigContext'
import { Card, CardBody, Button } from '@heroui/react'
import { ArrowPathIcon, PlayIcon } from '@heroicons/react/24/outline'
import type { Video } from '@/types/api'

const SESSION_STORAGE_KEY = 'randomPageState'

export default function RandomPage() {
  const router = useRouter()
  const { isLoading: configLoading, error: configError } = useConfig()
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null)
  const [history, setHistory] = useState<Video[]>([])
  const [isRestoring, setIsRestoring] = useState(true)

  const { data, error, isLoading, mutate } = useRandomVideos(1, { refreshInterval: 0 })

  // Log SWR hook state
  useEffect(() => {
    console.log('[RandomPage] SWR state - isLoading:', isLoading, 'error:', error, 'data:', data)
  }, [isLoading, error, data])

  // Restore state from sessionStorage on mount
  useEffect(() => {
    console.log('[RandomPage] Mount - Restoring state from sessionStorage')
    const savedState = sessionStorage.getItem(SESSION_STORAGE_KEY)
    console.log('[RandomPage] Saved state:', savedState)
    if (savedState) {
      try {
        const { currentVideo: savedVideo, history: savedHistory } = JSON.parse(savedState)
        console.log('[RandomPage] Parsed saved video:', savedVideo)
        console.log('[RandomPage] Parsed saved history length:', savedHistory?.length)
        if (savedVideo) {
          setCurrentVideo(savedVideo)
          setHasRestored(true)
          console.log('[RandomPage] Successfully restored video, setting hasRestored to true')
        }
        if (savedHistory && Array.isArray(savedHistory)) {
          setHistory(savedHistory)
        }
      } catch (e) {
        console.error('Failed to restore state:', e)
      }
    }
    console.log('[RandomPage] Setting isRestoring to false')
    setIsRestoring(false)
  }, [])

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    console.log('[RandomPage] Save state effect - isRestoring:', isRestoring, 'currentVideo:', currentVideo?.video_id, 'history length:', history.length)
    if (!isRestoring && (currentVideo || history.length > 0)) {
      const stateToSave = { currentVideo, history }
      console.log('[RandomPage] Saving state to sessionStorage:', stateToSave)
      sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify(stateToSave)
      )
    }
  }, [currentVideo, history, isRestoring])

  // Track if we've restored from sessionStorage
  const [hasRestored, setHasRestored] = useState(false)

  // Update currentVideo when data changes
  useEffect(() => {
    console.log('[RandomPage] Data effect - data:', data, 'isRestoring:', isRestoring, 'hasRestored:', hasRestored, 'currentVideo:', currentVideo?.video_id)

    // Don't update from data if we already have a video from sessionStorage
    if (data?.items?.[0] && !isRestoring && !hasRestored) {
      console.log('[RandomPage] Setting currentVideo from data:', data.items[0].video_id)
      setCurrentVideo(data.items[0])
    }
  }, [data, isRestoring, hasRestored, currentVideo])

  const handleShuffle = () => {
    console.log('[RandomPage] handleShuffle called')
    // Add current video to history before getting new one
    if (currentVideo) {
      console.log('[RandomPage] Adding current video to history:', currentVideo.video_id)
      setHistory(prev => [currentVideo, ...prev].slice(0, 50)) // Keep last 50 videos
    }
    // Reset hasRestored flag to allow new data to be set
    setHasRestored(false)
    console.log('[RandomPage] Reset hasRestored to false, calling mutate to fetch new video')
    mutate()
  }

  const handleVideoClick = (video: Video) => {
    console.log('[RandomPage] handleVideoClick - navigating to video:', video.video_id)
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
              ランダム動画
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
            ランダム動画
          </h1>
          <p className="text-lg text-purple-600 dark:text-purple-300 mb-8">
            ランダムに選ばれた動画で新しい発見を
          </p>
        </div>

        {/* Shuffle Button */}
        <div className="text-center">
          <Button
            color="primary"
            size="lg"
            onPress={handleShuffle}
            startContent={<ArrowPathIcon className="w-5 h-5" />}
            isLoading={isLoading}
          >
            シャッフル
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <ErrorMessage
            message="ランダム動画の読み込みに失敗しました"
            onRetry={handleRetry}
          />
        )}

        {/* Loading State */}
        {(isLoading || isRestoring) && !currentVideo && (
          <Loading label="ランダム動画を選択中..." />
        )}

        {/* Current Random Video */}
        {currentVideo && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                今回の選出
              </h2>
            </div>

            <div className="flex justify-center">
              <VideoCard
                key={currentVideo.video_id}
                video={currentVideo}
                onClick={handleVideoClick}
              />
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-4">
                過去の選出
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 justify-items-center">
              {history.map((video) => (
                <VideoCard
                  key={`history-${video.video_id}`}
                  video={video}
                  onClick={handleVideoClick}
                  className="opacity-75 hover:opacity-100 transition-opacity"
                />
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <PlayIcon className="w-5 h-5 text-purple-500" />
                <span>使い方</span>
              </h3>
              <div className="space-y-2 text-gray-600 dark:text-gray-400">
                <p>• シャッフルボタンを押してください</p>
                <p>• ランダムに選ばれた動画が1本表示されます</p>
                <p>• 過去に表示された動画も履歴として確認できます</p>
                <p>• 新しい動画との出会いを楽しんでください！</p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Empty State */}
        {!currentVideo && !isLoading && !error && !isRestoring && (
          <Card className="max-w-md mx-auto">
            <CardBody className="text-center p-12">
              <ArrowPathIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                シャッフルして動画を発見しよう
              </h3>
              <p className="text-gray-500 dark:text-gray-500 mb-6">
                シャッフルボタンを押してランダムな動画を表示します
              </p>
              <Button
                color="primary"
                size="lg"
                onPress={handleShuffle}
                startContent={<ArrowPathIcon className="w-5 h-5" />}
              >
                最初のシャッフル
              </Button>
            </CardBody>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
