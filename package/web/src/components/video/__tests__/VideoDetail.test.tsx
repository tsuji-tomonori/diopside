import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import VideoDetail from '../VideoDetail'
import { useVideo } from '@/hooks/useApi'
import type { Video } from '@/types/api'

// Mock the dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/hooks/useApi', () => ({
  useVideo: jest.fn(),
}))

// Mock Hero UI components
jest.mock('@heroui/react', () => ({
  Button: ({ children, onPress, startContent, ...props }: {
    children: React.ReactNode;
    onPress?: () => void;
    startContent?: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <button onClick={onPress} {...props}>
      {startContent}
      {children}
    </button>
  ),
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, fill, unoptimized, ...props }: {
    src: string;
    alt: string;
    fill?: boolean;
    unoptimized?: boolean;
    [key: string]: unknown
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} data-fill={fill?.toString()} data-unoptimized={unoptimized?.toString()} {...props} />
  ),
}))

// Mock window.open
const mockOpen = jest.fn()
Object.defineProperty(window, 'open', {
  value: mockOpen,
  writable: true,
})

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
}

const mockVideo: Video = {
  video_id: 'test-video-123',
  title: 'テスト動画のタイトル',
  tags: ['ゲーム実況', 'ホラー', 'Cry of Fear'],
  year: 2023,
  thumbnail_url: 'https://example.com/thumbnail.jpg',
  created_at: '2023-06-15T12:00:00Z',
}

describe('VideoDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks()
      ; (useRouter as jest.Mock).mockReturnValue(mockRouter)
    mockOpen.mockClear()
  })

  it('loads and displays video data correctly', async () => {
    ; (useVideo as jest.Mock).mockReturnValue({
      data: mockVideo,
      error: null,
      isLoading: false,
    })

    render(<VideoDetail videoId="test-video-123" />)

    // Title should be displayed
    expect(screen.getByText('テスト動画のタイトル')).toBeInTheDocument()

    // Year should be displayed
    expect(screen.getByText('2023年')).toBeInTheDocument()

    // Date should be displayed
    expect(screen.getByText('2023年6月15日')).toBeInTheDocument()

    // Tags should be displayed
    expect(screen.getByText('ゲーム実況')).toBeInTheDocument()
    expect(screen.getByText('ホラー')).toBeInTheDocument()
    expect(screen.getByText('Cry of Fear')).toBeInTheDocument()

    // YouTube button should be displayed
    expect(screen.getByText('YouTubeで視聴')).toBeInTheDocument()

    // Thumbnail should be displayed
    const thumbnail = screen.getByAltText('テスト動画のタイトル')
    expect(thumbnail).toBeInTheDocument()
    expect(thumbnail).toHaveAttribute('src', mockVideo.thumbnail_url)
  })

  it('shows loading state', () => {
    ; (useVideo as jest.Mock).mockReturnValue({
      data: null,
      error: null,
      isLoading: true,
    })

    render(<VideoDetail videoId="test-video-123" />)

    // Should render loading skeleton
    expect(screen.getByTestId('video-detail-skeleton') || document.querySelector('.animate-pulse')).toBeTruthy()
  })

  it('shows error state when video is not found', () => {
    ; (useVideo as jest.Mock).mockReturnValue({
      data: null,
      error: new Error('Video not found'),
      isLoading: false,
    })

    render(<VideoDetail videoId="test-video-123" />)

    expect(screen.getByText('動画が見つかりません')).toBeInTheDocument()
  })

  it('opens YouTube video when YouTube button is clicked', async () => {
    ; (useVideo as jest.Mock).mockReturnValue({
      data: mockVideo,
      error: null,
      isLoading: false,
    })

    render(<VideoDetail videoId="test-video-123" />)

    const youtubeButton = screen.getByText('YouTubeで視聴')
    fireEvent.click(youtubeButton)

    expect(mockOpen).toHaveBeenCalledWith(
      'https://www.youtube.com/watch?v=test-video-123',
      '_blank'
    )
  })

  it('opens YouTube video when thumbnail is clicked', async () => {
    ; (useVideo as jest.Mock).mockReturnValue({
      data: mockVideo,
      error: null,
      isLoading: false,
    })

    render(<VideoDetail videoId="test-video-123" />)

    const thumbnailContainer = screen.getByAltText('テスト動画のタイトル').parentElement
    if (thumbnailContainer) {
      fireEvent.click(thumbnailContainer)
    }

    expect(mockOpen).toHaveBeenCalledWith(
      'https://www.youtube.com/watch?v=test-video-123',
      '_blank'
    )
  })

  it('navigates to tag search when tag is clicked', async () => {
    ; (useVideo as jest.Mock).mockReturnValue({
      data: mockVideo,
      error: null,
      isLoading: false,
    })

    render(<VideoDetail videoId="test-video-123" />)

    const gameTag = screen.getByText('ゲーム実況')
    fireEvent.click(gameTag)

    expect(mockRouter.push).toHaveBeenCalledWith(
      '/tags?selected=' + encodeURIComponent('ゲーム実況')
    )
  })

  it('navigates back when back button is clicked', async () => {
    // Mock window.history.length
    Object.defineProperty(window, 'history', {
      value: { length: 3 },
      writable: true,
    })

      ; (useVideo as jest.Mock).mockReturnValue({
        data: mockVideo,
        error: null,
        isLoading: false,
      })

    render(<VideoDetail videoId="test-video-123" />)

    const backButton = screen.getByText('戻る')
    fireEvent.click(backButton)

    expect(mockRouter.back).toHaveBeenCalled()
  })

  it('navigates to home when back button is clicked with no history', async () => {
    // Mock window.history.length to simulate direct access
    Object.defineProperty(window, 'history', {
      value: { length: 1 },
      writable: true,
    })

      ; (useVideo as jest.Mock).mockReturnValue({
        data: mockVideo,
        error: null,
        isLoading: false,
      })

    render(<VideoDetail videoId="test-video-123" />)

    const backButton = screen.getByText('戻る')
    fireEvent.click(backButton)

    expect(mockRouter.push).toHaveBeenCalledWith('/')
  })

  it('handles video without thumbnail', () => {
    const videoWithoutThumbnail = {
      ...mockVideo,
      thumbnail_url: undefined,
    }

      ; (useVideo as jest.Mock).mockReturnValue({
        data: videoWithoutThumbnail,
        error: null,
        isLoading: false,
      })

    render(<VideoDetail videoId="test-video-123" />)

    expect(screen.getByText('サムネイルなし')).toBeInTheDocument()
  })

  it('handles video without creation date', () => {
    const videoWithoutDate = {
      ...mockVideo,
      created_at: undefined,
    }

      ; (useVideo as jest.Mock).mockReturnValue({
        data: videoWithoutDate,
        error: null,
        isLoading: false,
      })

    render(<VideoDetail videoId="test-video-123" />)

    // Should render component successfully even without date
    expect(screen.getByText('テスト動画のタイトル')).toBeInTheDocument()
  })

  it('handles video with invalid date', () => {
    const videoWithInvalidDate = {
      ...mockVideo,
      created_at: 'invalid-date',
    }

      ; (useVideo as jest.Mock).mockReturnValue({
        data: videoWithInvalidDate,
        error: null,
        isLoading: false,
      })

    render(<VideoDetail videoId="test-video-123" />)

    // Should render component successfully even with invalid date
    expect(screen.getByText('テスト動画のタイトル')).toBeInTheDocument()
  })

  it('displays video metadata correctly', () => {
    ; (useVideo as jest.Mock).mockReturnValue({
      data: mockVideo,
      error: null,
      isLoading: false,
    })

    render(<VideoDetail videoId="test-video-123" />)

    // Video ID should be displayed
    expect(screen.getByText('test-video-123')).toBeInTheDocument()

    // Tag count should be displayed
    expect(screen.getByText('3個')).toBeInTheDocument()
  })

  it('handles video with no tags', () => {
    const videoWithoutTags = {
      ...mockVideo,
      tags: [],
    }

      ; (useVideo as jest.Mock).mockReturnValue({
        data: videoWithoutTags,
        error: null,
        isLoading: false,
      })

    render(<VideoDetail videoId="test-video-123" />)

    // Tag count should show 0
    expect(screen.getByText('0個')).toBeInTheDocument()

    // Tags header should still be visible even if no tags
    expect(screen.getByText('タグ')).toBeInTheDocument()
  })
})
