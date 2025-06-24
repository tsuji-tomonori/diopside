import { render, screen, fireEvent } from '@testing-library/react'
import { ThumbnailMuseum } from '@/components/museum/ThumbnailMuseum'
import type { Video } from '@/types/api'

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}))

describe('ThumbnailMuseum', () => {
  const video: Video = {
    video_id: 'v1',
    title: 'test video',
    tags: [],
    year: 2024,
    thumbnail_url: 'https://example.com/thumb.jpg',
    created_at: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders thumbnail and allows zoom on double click', () => {
    render(<ThumbnailMuseum videos={[video]} />)

    const img = screen.getByTestId('museum-thumbnail') as HTMLImageElement
    expect(img.style.transform).toContain('scale(1)')

    fireEvent.doubleClick(img)
    expect(img.style.transform).toContain('scale(1.5)')
  })

  it('updates position on drag', () => {
    render(<ThumbnailMuseum videos={[video]} />)

    const img = screen.getByTestId('museum-thumbnail') as HTMLImageElement

    fireEvent.mouseDown(img, { clientX: 10, clientY: 10 })
    fireEvent.mouseMove(img, { clientX: 60, clientY: 80 })
    fireEvent.mouseUp(img)

    expect(img.style.transform).toContain('translate(50px, 70px)')
  })
})
