'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { VideoCard } from '@/components/video/VideoCard'
import { Loading } from '@/components/common/Loading'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { useRandomVideos } from '@/hooks/useApi'
import { Card, CardBody, Button, Select, SelectItem } from '@heroui/react'
import { ArrowPathIcon, PlayIcon } from '@heroicons/react/24/outline'
import type { Video } from '@/types/api'

export default function RandomPage() {
  const [count, setCount] = useState(1)
  const [history, setHistory] = useState<Video[]>([])
  
  const { data, error, isLoading, mutate } = useRandomVideos(count)

  const handleCountChange = (keys: any) => {
    const newCount = Array.from(keys)[0] as string
    if (newCount) {
      setCount(parseInt(newCount, 10))
    }
  }

  const handleShuffle = () => {
    // Add current videos to history before getting new ones
    if (data?.items) {
      setHistory(prev => [...data.items, ...prev].slice(0, 50)) // Keep last 50 videos
    }
    mutate()
  }

  const handleVideoClick = (video: Video) => {
    // TODO: Implement video modal or navigation
    console.log('Video clicked:', video)
  }

  const handleRetry = () => {
    mutate()
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

        {/* Controls */}
        <div className="max-w-md mx-auto">
          <Card>
            <CardBody className="p-6">
              <div className="flex items-center space-x-4">
                <ArrowPathIcon className="w-6 h-6 text-purple-500" />
                <div className="flex-1">
                  <Select
                    label="表示数"
                    selectedKeys={[count.toString()]}
                    onSelectionChange={handleCountChange}
                    className="max-w-xs"
                  >
                    <SelectItem key="1" value="1">1本</SelectItem>
                    <SelectItem key="3" value="3">3本</SelectItem>
                    <SelectItem key="5" value="5">5本</SelectItem>
                    <SelectItem key="10" value="10">10本</SelectItem>
                  </Select>
                </div>
                <Button
                  color="primary"
                  variant="flat"
                  onPress={handleShuffle}
                  startContent={<ArrowPathIcon className="w-4 h-4" />}
                  size="sm"
                  isLoading={isLoading}
                >
                  シャッフル
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Error State */}
        {error && (
          <ErrorMessage
            message="ランダム動画の読み込みに失敗しました"
            onRetry={handleRetry}
          />
        )}

        {/* Loading State */}
        {isLoading && !data && (
          <Loading label="ランダム動画を選択中..." />
        )}

        {/* Current Random Videos */}
        {data && data.items.length > 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                今回の選出
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-items-center">
              {data.items.map((video) => (
                <VideoCard
                  key={video.video_id}
                  video={video}
                  onClick={handleVideoClick}
                />
              ))}
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
                <p>• 表示数を選択してシャッフルボタンを押してください</p>
                <p>• ランダムに選ばれた動画が表示されます</p>
                <p>• 過去に表示された動画も履歴として確認できます</p>
                <p>• 新しい動画との出会いを楽しんでください！</p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Empty State */}
        {!data && !isLoading && !error && (
          <Card>
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