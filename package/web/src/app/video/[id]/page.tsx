import VideoDetail from '@/components/video/VideoDetail'
import { ApiClient } from '@/lib/api'

interface VideoDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  try {
    // ビルド時のAPI URL（環境変数またはデフォルト値）
    const apiUrl = process.env.BUILD_TIME_API_URL || process.env.NEXT_PUBLIC_API_URL

    if (!apiUrl || apiUrl.includes('example.com') || apiUrl.includes('localhost')) {
      console.warn('No valid API URL configured for static generation, skipping pre-generation')
      // デモ用のサンプルIDを返す（実際のAPIが利用可能になったら削除）
      return [
        { id: 'sample-video-1' },
        { id: 'sample-video-2' },
        { id: 'sample-video-3' },
      ]
    }

    console.log('Generating static params for video pages...')

    // 複数年のデータを取得して動画IDのリストを作成
    const currentYear = new Date().getFullYear()
    const years = [currentYear - 2, currentYear - 1, currentYear] // 過去2年と今年
    const videoIds: string[] = []

    for (const year of years) {
      try {
        console.log(`Fetching videos for year ${year}...`)
        const response = await ApiClient.getVideosByYear(apiUrl, year, 50)
        const ids = response.items.map(video => video.video_id)
        videoIds.push(...ids)
        console.log(`Found ${ids.length} videos for year ${year}`)
      } catch (error) {
        console.warn(`Failed to fetch videos for year ${year}:`, error)
        // 年ごとのエラーは無視して続行
      }
    }

    // 最大500件に制限（ビルド時間を考慮）
    const limitedVideoIds = videoIds.slice(0, 500)

    console.log(`Generating static pages for ${limitedVideoIds.length} videos`)

    return limitedVideoIds.map((id) => ({
      id: encodeURIComponent(id),
    }))
  } catch (error) {
    console.error('Failed to generate static params:', error)
    // エラー時はサンプルIDを返す
    return [
      { id: 'sample-video-1' },
      { id: 'sample-video-2' },
    ]
  }
}

export default async function VideoDetailPage({ params }: VideoDetailPageProps) {
  const { id } = await params
  const videoId = decodeURIComponent(id)

  return <VideoDetail videoId={videoId} />
}
