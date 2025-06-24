import { render, screen } from '@testing-library/react'
import MuseumPage from '@/app/museum/page'
import { useRandomVideos } from '@/hooks/useApi'
import { useConfig } from '@/contexts/ConfigContext'

jest.mock('@/hooks/useApi', () => ({
  useRandomVideos: jest.fn(),
}))

jest.mock('@/contexts/ConfigContext', () => ({
  useConfig: jest.fn(),
}))

jest.mock('@/components/museum/ThumbnailMuseum', () => ({
  ThumbnailMuseum: ({ videos }: { videos: any[] }) => (
    <div data-testid="thumbnail-museum" data-count={videos.length} />
  ),
}))

describe('MuseumPage', () => {
  beforeEach(() => {
    ;(useConfig as jest.Mock).mockReturnValue({ isLoading: false, error: null })
  })

  it('shows loading state', () => {
    ;(useRandomVideos as jest.Mock).mockReturnValue({ data: null, error: null, isLoading: true })
    render(<MuseumPage />)
    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  it('shows error state', () => {
    const mockMutate = jest.fn()
    ;(useRandomVideos as jest.Mock).mockReturnValue({ data: null, error: new Error('fail'), isLoading: false, mutate: mockMutate })
    render(<MuseumPage />)
    expect(screen.getByText('サムネイルの取得に失敗しました')).toBeInTheDocument()
  })

  it('renders thumbnails when data loaded', () => {
    const items = [
      { video_id: 'v1', title: 't', tags: [], year: 2024, thumbnail_url: '', created_at: '' },
      { video_id: 'v2', title: 't2', tags: [], year: 2024, thumbnail_url: '', created_at: '' },
    ]
    ;(useRandomVideos as jest.Mock).mockReturnValue({ data: { items }, error: null, isLoading: false })
    render(<MuseumPage />)
    expect(screen.getByText('🖼️ サムネイル美術館')).toBeInTheDocument()
    expect(screen.getByTestId('thumbnail-museum')).toHaveAttribute('data-count', '2')
  })
})
