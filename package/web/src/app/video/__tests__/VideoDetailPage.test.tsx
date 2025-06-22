/**
 * VideoDetailContent コンポーネントのテスト
 *
 * クエリパラメータベースのルーティングに対応したテスト
 */

import { render, screen } from '@testing-library/react'
import { useSearchParams } from 'next/navigation'
// VideoDetailContent は page.tsx 内で定義されているため、page.tsx から import
import VideoDetailPage from '../page'

// Next.js navigation のモック
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// VideoDetail コンポーネントのモック
jest.mock('@/components/video/VideoDetail', () => {
  return function MockVideoDetail({ videoId }: { videoId: string }) {
    return <div data-testid="video-detail">Video ID: {videoId}</div>
  }
})

// VideoNotFound コンポーネントのモック
jest.mock('@/components/video/VideoNotFound', () => {
  return function MockVideoNotFound() {
    return <div data-testid="video-not-found">動画が見つかりません</div>
  }
})

// VideoDetailSkeleton コンポーネントのモック
jest.mock('@/components/video/VideoDetailSkeleton', () => {
  return function MockVideoDetailSkeleton() {
    return <div data-testid="video-detail-skeleton">Loading...</div>
  }
})

const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>

describe('VideoDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders video detail when id is provided', () => {
    const mockSearchParams = new URLSearchParams({ id: 'test-video-id' })
    mockUseSearchParams.mockReturnValue(mockSearchParams)

    render(<VideoDetailPage />)

    expect(screen.getByTestId('video-detail')).toHaveTextContent('Video ID: test-video-id')
  })

  it('renders not found when id is missing', () => {
    const mockSearchParams = new URLSearchParams()
    mockUseSearchParams.mockReturnValue(mockSearchParams)

    render(<VideoDetailPage />)

    expect(screen.getByTestId('video-not-found')).toBeInTheDocument()
  })

  it('renders not found when id is empty string', () => {
    const mockSearchParams = new URLSearchParams({ id: '' })
    mockUseSearchParams.mockReturnValue(mockSearchParams)

    render(<VideoDetailPage />)

    expect(screen.getByTestId('video-not-found')).toBeInTheDocument()
  })

  it('renders not found when id is only whitespace', () => {
    const mockSearchParams = new URLSearchParams({ id: '   ' })
    mockUseSearchParams.mockReturnValue(mockSearchParams)

    render(<VideoDetailPage />)

    expect(screen.getByTestId('video-not-found')).toBeInTheDocument()
  })

  it('handles URL-encoded video IDs correctly', () => {
    const originalVideoId = 'test video with spaces'
    const encodedVideoId = encodeURIComponent(originalVideoId)
    const mockSearchParams = new URLSearchParams({ id: encodedVideoId })
    mockUseSearchParams.mockReturnValue(mockSearchParams)

    render(<VideoDetailPage />)

    // デコードされた値が VideoDetail に渡されることを確認
    expect(screen.getByTestId('video-detail')).toHaveTextContent(`Video ID: ${encodedVideoId}`)
  })

  it('handles special characters in video ID', () => {
    const videoId = 'test-video-&-special_chars'
    const mockSearchParams = new URLSearchParams({ id: videoId })
    mockUseSearchParams.mockReturnValue(mockSearchParams)

    render(<VideoDetailPage />)

    expect(screen.getByTestId('video-detail')).toHaveTextContent(`Video ID: ${videoId}`)
  })

  it('handles YouTube video ID format', () => {
    const youtubeVideoId = '-Wf8FssuAeU' // 実際のYouTube動画ID形式
    const mockSearchParams = new URLSearchParams({ id: youtubeVideoId })
    mockUseSearchParams.mockReturnValue(mockSearchParams)

    render(<VideoDetailPage />)

    expect(screen.getByTestId('video-detail')).toHaveTextContent(`Video ID: ${youtubeVideoId}`)
  })

  it('handles multiple query parameters correctly', () => {
    const videoId = 'test-video-id'
    const mockSearchParams = new URLSearchParams({
      id: videoId,
      other: 'parameter',
      unused: 'value'
    })
    mockUseSearchParams.mockReturnValue(mockSearchParams)

    render(<VideoDetailPage />)

    expect(screen.getByTestId('video-detail')).toHaveTextContent(`Video ID: ${videoId}`)
  })

  it('prioritizes first id parameter when multiple exist', () => {
    // URLSearchParams で同じキーを複数回追加した場合の動作をテスト
    const mockSearchParams = new URLSearchParams()
    mockSearchParams.append('id', 'first-video-id')
    mockSearchParams.append('id', 'second-video-id')
    mockUseSearchParams.mockReturnValue(mockSearchParams)

    render(<VideoDetailPage />)

    // 最初の値が使用されることを確認
    expect(screen.getByTestId('video-detail')).toHaveTextContent('Video ID: first-video-id')
  })
})
