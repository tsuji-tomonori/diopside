import { render } from '@testing-library/react'
import { useSearchParams } from 'next/navigation'
import VideoDetailPage from '../page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}))

// Mock components
jest.mock('@/components/video/VideoDetail', () => ({
  __esModule: true,
  default: ({ videoId }: { videoId: string }) => (
    <div data-testid="video-detail">Video ID: {videoId}</div>
  ),
}))

jest.mock('@/components/video/VideoDetailSkeleton', () => ({
  __esModule: true,
  default: () => <div data-testid="video-skeleton">Loading...</div>,
}))

jest.mock('@/components/video/VideoNotFound', () => ({
  __esModule: true,
  default: () => <div data-testid="video-not-found">Video not found</div>,
}))

describe('VideoDetailPage', () => {
  const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders video detail when id is provided', () => {
    const mockSearchParams = new URLSearchParams({ id: 'test-video-id' })
    mockUseSearchParams.mockReturnValue(mockSearchParams)

    const { getByTestId } = render(<VideoDetailPage />)

    expect(getByTestId('video-detail')).toHaveTextContent('Video ID: test-video-id')
  })

  it('renders not found when id is missing', () => {
    const mockSearchParams = new URLSearchParams()
    mockUseSearchParams.mockReturnValue(mockSearchParams)

    const { getByTestId } = render(<VideoDetailPage />)

    expect(getByTestId('video-not-found')).toBeInTheDocument()
  })
})
