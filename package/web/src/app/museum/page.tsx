'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { Loading } from '@/components/common/Loading'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { ConstellationMuseum } from '@/components/museum/ConstellationMuseum'
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
    <>
      {data && <ConstellationMuseum videos={data.items} />}
    </>
  )
}
