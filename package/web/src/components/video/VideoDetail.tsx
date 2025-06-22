'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeftIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { Button } from '@heroui/react'
import { useVideo } from '@/hooks/useApi'
import VideoDetailSkeleton from './VideoDetailSkeleton'
import VideoNotFound from './VideoNotFound'

interface VideoDetailProps {
  videoId: string
}

export default function VideoDetail({ videoId }: VideoDetailProps) {
  const router = useRouter()
  const { data: video, error, isLoading } = useVideo(videoId)

  if (isLoading) return <VideoDetailSkeleton />
  if (error || !video) return <VideoNotFound />

  const formatDate = (dateString?: string) => {
    if (!dateString) return '不明'
    try {
      const date = new Date(dateString)
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
    } catch {
      return '不明'
    }
  }

  const getYouTubeUrl = (videoId: string) => {
    return `https://www.youtube.com/watch?v=${videoId}`
  }

  const handleTagClick = (tag: string) => {
    router.push(`/tags?selected=${encodeURIComponent(tag)}`)
  }

  const handleBackClick = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            onPress={handleBackClick}
            variant="bordered"
            startContent={<ArrowLeftIcon className="w-4 h-4" />}
          >
            戻る
          </Button>
        </div>

        {/* Video Hero Section */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Thumbnail */}
            <div className="md:w-1/2">
              {video.thumbnail_url ? (
                <div className="relative w-full h-64 md:h-full cursor-pointer" onClick={() => window.open(getYouTubeUrl(video.video_id), '_blank')}>
                  <Image
                    src={video.thumbnail_url}
                    alt={video.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-full h-64 md:h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">サムネイルなし</span>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="md:w-1/2 p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
                {video.title}
              </h1>

              {/* Metadata */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium mr-2">投稿日:</span>
                  <span>{formatDate(video.created_at)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium mr-2">年:</span>
                  <span>{video.year}年</span>
                </div>
              </div>

              {/* Tags */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">タグ</h3>
                {video.tags && video.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {video.tags.map((tag, index) => (
                      <button
                        key={index}
                        onClick={() => handleTagClick(tag)}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">タグがありません</div>
                )}
              </div>

              {/* YouTube Link */}
              <div className="pt-4 border-t border-gray-200">
                <Button
                  onPress={() => window.open(getYouTubeUrl(video.video_id), '_blank')}
                  color="danger"
                  startContent={<ArrowTopRightOnSquareIcon className="w-5 h-5" />}
                  size="lg"
                >
                  YouTubeで視聴
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">動画情報</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">動画ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono break-all">{video.video_id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">タグ数</dt>
              <dd className="mt-1 text-sm text-gray-900">{video.tags?.length || 0}個</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
