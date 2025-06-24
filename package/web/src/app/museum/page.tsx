'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { Loading } from '@/components/common/Loading'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { ThumbnailMuseum } from '@/components/museum/ThumbnailMuseum'
import { useRandomVideos } from '@/hooks/useApi'
import { useConfig } from '@/contexts/ConfigContext'

export default function MuseumPage() {
  const { isLoading: configLoading, error: configError } = useConfig()
  const { data, error, isLoading, mutate } = useRandomVideos(20)

  if (configLoading || isLoading) {
    return (
      <MainLayout>
        <Loading />
      </MainLayout>
    )
  }

  if (configError || error) {
    return (
      <MainLayout>
        <ErrorMessage message="サムネイルの取得に失敗しました" onRetry={() => mutate()} />
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-4xl font-bold text-purple-800 dark:text-purple-200 text-center">
          🖼️ サムネイル美術館
        </h1>
        {data && <ThumbnailMuseum videos={data.items} />}
      </div>
    </MainLayout>
  )
}
