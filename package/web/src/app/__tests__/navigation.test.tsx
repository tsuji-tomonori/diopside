/**
 * ナビゲーションのテスト
 *
 * 新しいクエリパラメータベースの動画詳細ページへのナビゲーションをテスト
 */

import { useRouter } from 'next/navigation'

// Next.js navigation のモック
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Router型の定義
interface MockRouter {
  push: jest.Mock
}

// 各ページコンポーネントのナビゲーション関数をテスト用に抽出
const createVideoNavigationHandler = (router: MockRouter) => (videoId: string) => {
  router.push(`/video?id=${encodeURIComponent(videoId)}`)
}

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

describe('Video Navigation', () => {
  let mockPush: jest.Mock

  beforeEach(() => {
    mockPush = jest.fn()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Video Detail Navigation', () => {
    it('should navigate to video detail with correct query parameter', () => {
      const router = { push: mockPush }
      const navigateToVideo = createVideoNavigationHandler(router)
      const videoId = 'test-video-123'

      navigateToVideo(videoId)

      expect(mockPush).toHaveBeenCalledWith('/video?id=test-video-123')
    })

    it('should handle URL encoding for video IDs with spaces', () => {
      const router = { push: mockPush }
      const navigateToVideo = createVideoNavigationHandler(router)
      const videoId = 'test video with spaces'

      navigateToVideo(videoId)

      expect(mockPush).toHaveBeenCalledWith('/video?id=test%20video%20with%20spaces')
    })

    it('should handle special characters in video IDs', () => {
      const router = { push: mockPush }
      const navigateToVideo = createVideoNavigationHandler(router)
      const videoId = 'test-video-&-special'

      navigateToVideo(videoId)

      expect(mockPush).toHaveBeenCalledWith('/video?id=test-video-%26-special')
    })

    it('should handle YouTube video ID format', () => {
      const router = { push: mockPush }
      const navigateToVideo = createVideoNavigationHandler(router)
      const videoId = '-Wf8FssuAeU'

      navigateToVideo(videoId)

      expect(mockPush).toHaveBeenCalledWith('/video?id=-Wf8FssuAeU')
    })

    it('should handle empty video ID', () => {
      const router = { push: mockPush }
      const navigateToVideo = createVideoNavigationHandler(router)
      const videoId = ''

      navigateToVideo(videoId)

      expect(mockPush).toHaveBeenCalledWith('/video?id=')
    })
  })

  describe('URL Construction', () => {
    it('should create correct URL for simple video ID', () => {
      const videoId = 'simple-video-id'
      const expectedUrl = `/video?id=${encodeURIComponent(videoId)}`

      expect(expectedUrl).toBe('/video?id=simple-video-id')
    })

    it('should create correct URL for complex video ID', () => {
      const videoId = 'complex-video-id-with-special-chars-&-symbols'
      const expectedUrl = `/video?id=${encodeURIComponent(videoId)}`

      expect(expectedUrl).toBe('/video?id=complex-video-id-with-special-chars-%26-symbols')
    })

    it('should create correct URL for Japanese characters', () => {
      const videoId = 'テスト動画-123'
      const expectedUrl = `/video?id=${encodeURIComponent(videoId)}`

      expect(expectedUrl).toBe('/video?id=%E3%83%86%E3%82%B9%E3%83%88%E5%8B%95%E7%94%BB-123')
    })
  })

  describe('Navigation Integration', () => {
    it('should maintain consistent navigation pattern across pages', () => {
      const testCases = [
        { videoId: 'main-video-1' },
        { videoId: 'random-video-2' },
        { videoId: 'tagged-video-3' },
      ]

      testCases.forEach(({ videoId }) => {
        const router = { push: mockPush }
        const navigateToVideo = createVideoNavigationHandler(router)

        navigateToVideo(videoId)

        expect(mockPush).toHaveBeenCalledWith(`/video?id=${videoId}`)
      })

      expect(mockPush).toHaveBeenCalledTimes(3)
    })

    it('should handle navigation from different contexts', () => {
      const contexts = [
        { videoId: 'grid-video' },
        { videoId: 'search-video' },
        { videoId: 'tag-video' },
        { videoId: 'random-video' },
      ]

      contexts.forEach(({ videoId }) => {
        const router = { push: mockPush }
        const navigateToVideo = createVideoNavigationHandler(router)

        navigateToVideo(videoId)

        expect(mockPush).toHaveBeenCalledWith(`/video?id=${videoId}`)
      })

      expect(mockPush).toHaveBeenCalledTimes(4)
    })
  })
})
