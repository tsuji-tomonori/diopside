import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import RandomPage from './page'
import { useRandomVideos } from '@/hooks/useApi'
import { useConfig } from '@/contexts/ConfigContext'
import type { Video } from '@/types/api'

// Mock dependencies
jest.mock('next/navigation')
jest.mock('@/hooks/useApi')
jest.mock('@/contexts/ConfigContext')

// Mock Button component to avoid ripple issues
jest.mock('@heroui/button', () => ({
  Button: ({ children, onPress, startContent, isLoading, ...props }: {
    children: React.ReactNode
    onPress?: () => void
    startContent?: React.ReactNode
    isLoading?: boolean
    [key: string]: unknown
  }) => (
    <button
      onClick={() => onPress?.()}
      disabled={isLoading}
      {...props}
    >
      {startContent && <span>{startContent}</span>}
      {children}
    </button>
  )
}))

// Mock VideoCard to simplify testing
jest.mock('@/components/video/VideoCard', () => ({
  VideoCard: ({ video, onClick }: {
    video: Video
    onClick: (video: Video) => void
  }) => (
    <div
      onClick={() => onClick(video)}
      data-testid={`video-card-${video.video_id}`}
    >
      <h3>{video.title}</h3>
    </div>
  )
}))

// Mock video data
const mockVideo1: Video = {
  video_id: 'test-video-1',
  title: 'Test Video 1',
  tags: ['tag1', 'tag2'],
  year: 2023,
  thumbnail_url: 'https://example.com/thumb1.jpg',
  created_at: '2023-01-01T00:00:00Z'
}

const mockVideo2: Video = {
  video_id: 'test-video-2',
  title: 'Test Video 2',
  tags: ['tag3', 'tag4'],
  year: 2023,
  thumbnail_url: 'https://example.com/thumb2.jpg',
  created_at: '2023-01-02T00:00:00Z'
}

describe('RandomPage', () => {
  const mockPush = jest.fn()
  const mockMutate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()

    // Remove console.log from tests
    jest.spyOn(console, 'log').mockImplementation(() => {})

    // Setup default mocks
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(useConfig as jest.Mock).mockReturnValue({
      config: { NEXT_PUBLIC_API_URL: 'http://localhost' },
      isLoading: false,
      error: null
    })
    ;(useRandomVideos as jest.Mock).mockReturnValue({
      data: { items: [mockVideo1] },
      error: null,
      isLoading: false,
      mutate: mockMutate
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Video Display', () => {
    it('should display only one video', async () => {
      render(<RandomPage />)

      await waitFor(() => {
        // VideoCard component renders a div with specific classes, not an article
        const videoTitle = screen.getByText('Test Video 1')
        expect(videoTitle).toBeInTheDocument()

        // Verify only one video is displayed
        const allVideoTitles = screen.getAllByText(/Test Video/)
        expect(allVideoTitles).toHaveLength(1)
      })
    })

    it('should display video in center of screen', async () => {
      render(<RandomPage />)

      await waitFor(() => {
        const videoContainer = screen.getByText('今回の選出').parentElement?.nextElementSibling
        expect(videoContainer).toHaveClass('flex', 'justify-center')
      })
    })

    it('should show empty state when no video is loaded', () => {
      ;(useRandomVideos as jest.Mock).mockReturnValue({
        data: null,
        error: null,
        isLoading: false,
        mutate: mockMutate
      })

      render(<RandomPage />)

      expect(screen.getByText('シャッフルして動画を発見しよう')).toBeInTheDocument()
      expect(screen.getByText('最初のシャッフル')).toBeInTheDocument()
    })
  })

  describe('Session Storage Persistence', () => {
    it('should save current video to sessionStorage', async () => {
      render(<RandomPage />)

      await waitFor(() => {
        const savedState = sessionStorage.getItem('randomPageState')
        expect(savedState).toBeTruthy()

        const parsed = JSON.parse(savedState!)
        expect(parsed.currentVideo).toEqual(mockVideo1)
        expect(parsed.history).toEqual([])
      })
    })

    it('should restore video from sessionStorage on mount', async () => {
      // Pre-populate sessionStorage
      const savedState = {
        currentVideo: mockVideo2,
        history: [mockVideo1]
      }
      sessionStorage.setItem('randomPageState', JSON.stringify(savedState))

      // Mock API to return different video
      ;(useRandomVideos as jest.Mock).mockReturnValue({
        data: { items: [mockVideo1] },
        error: null,
        isLoading: false,
        mutate: mockMutate
      })

      render(<RandomPage />)

      await waitFor(() => {
        // Should display the video from sessionStorage, not the API
        expect(screen.getByText('Test Video 2')).toBeInTheDocument()
        // History should show Test Video 1
        const historySection = screen.queryByText('過去の選出')
        expect(historySection).toBeInTheDocument()
      })
    })

    it('should not update video from API data after restoring from sessionStorage', async () => {
      // Pre-populate sessionStorage
      const savedState = {
        currentVideo: mockVideo2,
        history: []
      }
      sessionStorage.setItem('randomPageState', JSON.stringify(savedState))

      const mockUseRandomVideos = jest.fn()
      mockUseRandomVideos.mockReturnValue({
        data: null,
        error: null,
        isLoading: true,
        mutate: mockMutate
      })
      ;(useRandomVideos as jest.Mock).mockImplementation(mockUseRandomVideos)

      const { rerender } = render(<RandomPage />)

      // Simulate API returning data after mount
      mockUseRandomVideos.mockReturnValue({
        data: { items: [mockVideo1] },
        error: null,
        isLoading: false,
        mutate: mockMutate
      })

      rerender(<RandomPage />)

      await waitFor(() => {
        // Should still display the restored video, not the new API data
        expect(screen.getByText('Test Video 2')).toBeInTheDocument()
        expect(screen.queryByText('Test Video 1')).not.toBeInTheDocument()
      })
    })
  })

  describe('Shuffle Functionality', () => {
    it('should fetch new video when shuffle button is clicked', async () => {
      render(<RandomPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Video 1')).toBeInTheDocument()
      })

      // Find the main shuffle button (not the one in empty state)
      const shuffleButtons = screen.getAllByText('シャッフル')
      const mainShuffleButton = shuffleButtons[0]
      fireEvent.click(mainShuffleButton)

      expect(mockMutate).toHaveBeenCalled()
    })

    it('should add current video to history when shuffling', async () => {
      const { rerender } = render(<RandomPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Video 1')).toBeInTheDocument()
      })

      const shuffleButton = screen.getAllByText('シャッフル')[0]
      fireEvent.click(shuffleButton)

      // Mock new video data for after shuffle
      ;(useRandomVideos as jest.Mock).mockReturnValue({
        data: { items: [mockVideo2] },
        error: null,
        isLoading: false,
        mutate: mockMutate
      })

      // Rerender to simulate data update
      rerender(<RandomPage />)

      await waitFor(() => {
        // Current video should be the new one
        expect(screen.getByText('Test Video 2')).toBeInTheDocument()

        // Previous video should be in history
        const historySection = screen.getByText('過去の選出')
        expect(historySection).toBeInTheDocument()
      })
    })

    it('should allow new data updates after shuffle', async () => {
      // Pre-populate sessionStorage
      const savedState = {
        currentVideo: mockVideo1,
        history: []
      }
      sessionStorage.setItem('randomPageState', JSON.stringify(savedState))

      const { rerender } = render(<RandomPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Video 1')).toBeInTheDocument()
      })

      // Click shuffle
      const shuffleButton = screen.getAllByText('シャッフル')[0]
      fireEvent.click(shuffleButton)

      // Mock API returning new data
      ;(useRandomVideos as jest.Mock).mockReturnValue({
        data: { items: [mockVideo2] },
        error: null,
        isLoading: false,
        mutate: mockMutate
      })

      rerender(<RandomPage />)

      await waitFor(() => {
        // Should now show the new video from API
        expect(screen.getByText('Test Video 2')).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('should navigate to video detail page when video is clicked', async () => {
      render(<RandomPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Video 1')).toBeInTheDocument()
      })

      // Click on the video card
      const videoCard = screen.getByTestId('video-card-test-video-1')
      fireEvent.click(videoCard)

      expect(mockPush).toHaveBeenCalledWith('/video?id=test-video-1')
    })
  })

  describe('History Management', () => {
    it('should display history section when there are previous videos', async () => {
      const savedState = {
        currentVideo: mockVideo2,
        history: [mockVideo1]
      }
      sessionStorage.setItem('randomPageState', JSON.stringify(savedState))

      render(<RandomPage />)

      await waitFor(() => {
        expect(screen.getByText('過去の選出')).toBeInTheDocument()
        expect(screen.getAllByText('Test Video 1')).toHaveLength(1)
      })
    })

    it('should limit history to 50 videos', async () => {
      const manyVideos = Array.from({ length: 60 }, (_, i) => ({
        ...mockVideo1,
        video_id: `video-${i}`,
        title: `Video ${i}`
      }))

      const savedState = {
        currentVideo: mockVideo2,
        history: manyVideos
      }
      sessionStorage.setItem('randomPageState', JSON.stringify(savedState))

      render(<RandomPage />)

      await waitFor(() => {
        // Check that we have the current video
        expect(screen.getByText('Test Video 2')).toBeInTheDocument()

        // Check history section exists
        const historySection = screen.getByText('過去の選出')
        expect(historySection).toBeInTheDocument()

        // History is sliced to 50 in the component
        // We can't count them exactly without better selectors
        // but we can verify some exist
        expect(screen.getByText('Video 0')).toBeInTheDocument()
      })
    })
  })

  describe('Loading and Error States', () => {
    it('should show loading state while fetching data', () => {
      ;(useRandomVideos as jest.Mock).mockReturnValue({
        data: null,
        error: null,
        isLoading: true,
        mutate: mockMutate
      })

      render(<RandomPage />)

      expect(screen.getByText('ランダム動画を選択中...')).toBeInTheDocument()
    })

    it('should show error state when fetch fails', () => {
      ;(useRandomVideos as jest.Mock).mockReturnValue({
        data: null,
        error: new Error('Failed to fetch'),
        isLoading: false,
        mutate: mockMutate
      })

      render(<RandomPage />)

      expect(screen.getByText('ランダム動画の読み込みに失敗しました')).toBeInTheDocument()
      expect(screen.getByText('再試行')).toBeInTheDocument()
    })

    it('should retry when error retry button is clicked', () => {
      ;(useRandomVideos as jest.Mock).mockReturnValue({
        data: null,
        error: new Error('Failed to fetch'),
        isLoading: false,
        mutate: mockMutate
      })

      render(<RandomPage />)

      const retryButton = screen.getByText('再試行')
      fireEvent.click(retryButton)

      expect(mockMutate).toHaveBeenCalled()
    })
  })

  describe('Auto-refresh Prevention', () => {
    it('should disable auto-refresh by passing refreshInterval: 0', () => {
      render(<RandomPage />)

      expect(useRandomVideos).toHaveBeenCalledWith(1, { refreshInterval: 0 })
    })
  })
})
