import { render, screen } from '@testing-library/react'
import VideoDetailPage from '../[id]/page'

// Mock the VideoDetail component
jest.mock('@/components/video/VideoDetail', () => {
  return function MockVideoDetail({ videoId }: { videoId: string }) {
    return (
      <div data-testid="video-detail-component">
        Video Detail for: {videoId}
      </div>
    )
  }
})

describe('VideoDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders VideoDetail component with correct video ID', async () => {
    const mockParams = { id: 'test-video-123' }

    // Since the component is async, we need to render it properly
    const Component = await VideoDetailPage({ params: Promise.resolve(mockParams) })
    render(Component)

    expect(screen.getByTestId('video-detail-component')).toBeInTheDocument()
    expect(screen.getByText('Video Detail for: test-video-123')).toBeInTheDocument()
  })

  it('handles encoded video ID correctly', async () => {
    const encodedId = encodeURIComponent('video-with-特殊文字')
    const mockParams = { id: encodedId }

    const Component = await VideoDetailPage({ params: Promise.resolve(mockParams) })
    render(Component)

    // Should decode the ID properly
    expect(screen.getByText('Video Detail for: video-with-特殊文字')).toBeInTheDocument()
  })

  it('handles video ID with spaces', async () => {
    const encodedId = encodeURIComponent('video with spaces')
    const mockParams = { id: encodedId }

    const Component = await VideoDetailPage({ params: Promise.resolve(mockParams) })
    render(Component)

    expect(screen.getByText('Video Detail for: video with spaces')).toBeInTheDocument()
  })

  it('handles video ID with special characters', async () => {
    const specialId = 'video-123!@#$%^&*()'
    const encodedId = encodeURIComponent(specialId)
    const mockParams = { id: encodedId }

    const Component = await VideoDetailPage({ params: Promise.resolve(mockParams) })
    render(Component)

    expect(screen.getByText(`Video Detail for: ${specialId}`)).toBeInTheDocument()
  })

  it('handles empty video ID', async () => {
    const mockParams = { id: '' }

    const Component = await VideoDetailPage({ params: Promise.resolve(mockParams) })
    render(Component)

    expect(screen.getByTestId('video-detail-component')).toBeInTheDocument()
    expect(screen.getByText(/Video Detail for:/)).toBeInTheDocument()
  })

  it('handles video ID with URL-safe characters', async () => {
    const videoId = 'video-123_abc-def'
    const mockParams = { id: videoId }

    const Component = await VideoDetailPage({ params: Promise.resolve(mockParams) })
    render(Component)

    expect(screen.getByText(`Video Detail for: ${videoId}`)).toBeInTheDocument()
  })
})
