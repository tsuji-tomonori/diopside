'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import VideoDetail from '@/components/video/VideoDetail'
import VideoDetailSkeleton from '@/components/video/VideoDetailSkeleton'
import VideoNotFound from '@/components/video/VideoNotFound'

function VideoDetailContent() {
  const searchParams = useSearchParams()
  const videoId = searchParams.get('id')

  if (!videoId || videoId.trim() === '') {
    return <VideoNotFound />
  }

  return <VideoDetail videoId={videoId} />
}

export default function VideoDetailPage() {
  return (
    <Suspense fallback={<VideoDetailSkeleton />}>
      <VideoDetailContent />
    </Suspense>
  )
}
