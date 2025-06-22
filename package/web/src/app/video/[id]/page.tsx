import VideoDetail from '@/components/video/VideoDetail'

interface VideoDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  // 静的エクスポートでは動的ルートにはgenerateStaticParamsが必要
  // 実際の動画IDは取得できないため、プレースホルダーを返す
  // CloudFront関数でルートのindex.htmlにリダイレクトし、
  // クライアントサイドルーティングで処理する
  return [
    { id: 'placeholder' }
  ]
}

export default async function VideoDetailPage({ params }: VideoDetailPageProps) {
  const { id } = await params
  const videoId = decodeURIComponent(id)

  return <VideoDetail videoId={videoId} />
}
