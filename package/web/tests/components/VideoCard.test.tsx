import { render, screen, fireEvent } from '@testing-library/react'
import { VideoCard } from '@/components/video/VideoCard'
import type { Video } from '@/types/api'

// Mock HeroUI components
jest.mock('@heroui/react', () => ({
  Card: ({ children, onPress, className, isPressable, ...props }: any) => {
    const { isPressable: _, ...validProps } = props;
    return (
      <div data-testid="card" onClick={onPress} className={className} {...validProps}>
        {children}
      </div>
    );
  },
  CardBody: ({ children, ...props }: any) => (
    <div data-testid="card-body" {...props}>
      {children}
    </div>
  ),
  CardFooter: ({ children, ...props }: any) => (
    <div data-testid="card-footer" {...props}>
      {children}
    </div>
  ),
  Image: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} data-testid="video-thumbnail" {...props} />
  ),
  Chip: ({ children, ...props }: any) => (
    <span data-testid="chip" {...props}>
      {children}
    </span>
  ),
}))

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  CalendarIcon: () => <div data-testid="calendar-icon" />,
  TagIcon: () => <div data-testid="tag-icon" />,
}))

describe('VideoCard', () => {
  const mockVideo: Video = {
    video_id: 'test123',
    title: 'Test Video Title',
    tags: ['tag1', 'tag2', 'tag3'],
    year: 2024,
    thumbnail_url: 'https://example.com/thumbnail.jpg',
    created_at: '2024-01-15T10:30:00Z',
  }

  it('renders video information correctly', () => {
    render(<VideoCard video={mockVideo} />)

    expect(screen.getByText('Test Video Title')).toBeInTheDocument()
    expect(screen.getByText('2024年')).toBeInTheDocument()
    expect(screen.getByText('2024/1/15')).toBeInTheDocument()
    expect(screen.getByTestId('video-thumbnail')).toHaveAttribute('src', mockVideo.thumbnail_url)
    expect(screen.getByTestId('video-thumbnail')).toHaveAttribute('alt', mockVideo.title)
  })

  it('renders tags correctly', () => {
    render(<VideoCard video={mockVideo} />)

    expect(screen.getByText('tag1')).toBeInTheDocument()
    expect(screen.getByText('tag2')).toBeInTheDocument()
    expect(screen.getByText('tag3')).toBeInTheDocument()
    expect(screen.getByTestId('tag-icon')).toBeInTheDocument()
  })

  it('renders placeholder when no thumbnail', () => {
    const videoWithoutThumbnail = { ...mockVideo, thumbnail_url: undefined }
    render(<VideoCard video={videoWithoutThumbnail} />)

    expect(screen.queryByTestId('video-thumbnail')).not.toBeInTheDocument()
    expect(screen.getByText('Te')).toBeInTheDocument() // First 2 characters of title
  })

  it('handles video without created_at', () => {
    const videoWithoutDate = { ...mockVideo, created_at: undefined }
    render(<VideoCard video={videoWithoutDate} />)

    expect(screen.getByText('2024年')).toBeInTheDocument()
    expect(screen.queryByText('2024/1/15')).not.toBeInTheDocument()
  })

  it('limits tags display to 3 and shows count for additional tags', () => {
    const videoWithManyTags = {
      ...mockVideo,
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
    }
    render(<VideoCard video={videoWithManyTags} />)

    expect(screen.getByText('tag1')).toBeInTheDocument()
    expect(screen.getByText('tag2')).toBeInTheDocument()
    expect(screen.getByText('tag3')).toBeInTheDocument()
    expect(screen.getByText('+2')).toBeInTheDocument()
    expect(screen.queryByText('tag4')).not.toBeInTheDocument()
  })

  it('calls onClick when card is clicked', () => {
    const mockOnClick = jest.fn()
    render(<VideoCard video={mockVideo} onClick={mockOnClick} />)

    fireEvent.click(screen.getByTestId('card'))

    expect(mockOnClick).toHaveBeenCalledWith(mockVideo)
  })

  it('does not call onClick when no handler provided', () => {
    render(<VideoCard video={mockVideo} />)

    // Should not throw error when clicking without onClick handler
    fireEvent.click(screen.getByTestId('card'))
  })

  it('applies custom className', () => {
    render(<VideoCard video={mockVideo} className="custom-class" />)

    expect(screen.getByTestId('card')).toHaveClass('custom-class')
  })

  it('handles invalid date gracefully', () => {
    const videoWithInvalidDate = { ...mockVideo, created_at: 'invalid-date' }
    render(<VideoCard video={videoWithInvalidDate} />)

    expect(screen.getByText('2024年')).toBeInTheDocument()
    // The component should handle invalid dates and not display them
    expect(screen.queryByText(/Invalid Date/)).not.toBeInTheDocument()
  })

  it('renders video with no tags', () => {
    const videoWithNoTags = { ...mockVideo, tags: [] }
    render(<VideoCard video={videoWithNoTags} />)

    expect(screen.queryByTestId('tag-icon')).not.toBeInTheDocument()
    expect(screen.getByText('Test Video Title')).toBeInTheDocument()
  })

  it('formats date correctly', () => {
    const videoWithSpecificDate = { 
      ...mockVideo, 
      created_at: '2024-12-25T15:30:45Z' 
    }
    render(<VideoCard video={videoWithSpecificDate} />)

    expect(screen.getByText('2024/12/26')).toBeInTheDocument()
  })

  it('renders without created_at date section when date is invalid', () => {
    const videoWithInvalidDate = { 
      ...mockVideo, 
      created_at: 'not-a-date' 
    }
    render(<VideoCard video={videoWithInvalidDate} />)

    expect(screen.getByText('2024年')).toBeInTheDocument()
    // Should not show the separator or invalid date
    expect(screen.queryByText('•')).not.toBeInTheDocument()
  })
})