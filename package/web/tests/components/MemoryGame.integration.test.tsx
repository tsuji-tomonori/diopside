import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryGame } from '@/components/memory/MemoryGame'
import { useRouter } from 'next/navigation'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, fill, className, sizes, unoptimized, ...props }: {
    src: string
    alt: string
    fill?: boolean
    className?: string
    sizes?: string
    unoptimized?: boolean
    [key: string]: unknown
  }) => (
    <img
      src={src}
      alt={alt}
      className={className}
      data-testid="next-image"
      data-fill={fill}
      data-sizes={sizes}
      data-unoptimized={unoptimized}
      {...props}
    />
  ),
}))

// Mock HeroUI components with real-like behavior
jest.mock('@heroui/react', () => ({
  Card: ({ children, onPress, className, isPressable, ...props }: React.PropsWithChildren<{
    onPress?: () => void
    className?: string
    isPressable?: boolean
    [key: string]: unknown
  }>) => {
    const handleClick = isPressable && onPress ? onPress : undefined
    return (
      <div
        data-testid={props['data-testid'] || 'card'}
        onClick={handleClick}
        className={className}
        data-pressable={isPressable}
        {...props}
      >
        {children}
      </div>
    )
  },
  CardBody: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="card-body" {...props}>
      {children}
    </div>
  ),
  Button: ({ children, onPress, startContent, ...props }: React.PropsWithChildren<{
    onPress?: () => void
    startContent?: React.ReactNode
    [key: string]: unknown
  }>) => (
    <button onClick={onPress} data-testid="button" {...props}>
      {startContent && <span data-testid="button-icon">{startContent}</span>}
      {children}
    </button>
  ),
  Chip: ({ children, startContent, className, ...props }: React.PropsWithChildren<{
    startContent?: React.ReactNode
    className?: string
    [key: string]: unknown
  }>) => (
    <div data-testid="chip" className={className} {...props}>
      {startContent && <span data-testid="chip-icon">{startContent}</span>}
      {children}
    </div>
  ),
}))

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  ArrowPathIcon: () => <div data-testid="arrow-path-icon" />,
  ClockIcon: () => <div data-testid="clock-icon" />,
  HeartIcon: () => <div data-testid="heart-icon" />,
  StarIcon: () => <div data-testid="star-icon" />,
  FireIcon: () => <div data-testid="fire-icon" />,
}))

describe('MemoryGame Integration Tests - 問題特定', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
      ; (useRouter as jest.Mock).mockReturnValue({
        push: mockPush,
      })
    // Silence console.log during tests
    jest.spyOn(console, 'log').mockImplementation(() => { })
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  describe('🔍 問題1: カード枚数が難易度と一致しない問題', () => {
    it('初級: APIが返すペア済みサムネイルから正確にカードが生成される', async () => {
      // APIは既にペア化されたサムネイルを返す（6ペア=12枚分）
      const beginnerThumbnails = [
        'https://img.youtube.com/vi/video1/maxresdefault.jpg',
        'https://img.youtube.com/vi/video1/maxresdefault.jpg', // ペア
        'https://img.youtube.com/vi/video2/maxresdefault.jpg',
        'https://img.youtube.com/vi/video2/maxresdefault.jpg', // ペア
        'https://img.youtube.com/vi/video3/maxresdefault.jpg',
        'https://img.youtube.com/vi/video3/maxresdefault.jpg', // ペア
        'https://img.youtube.com/vi/video4/maxresdefault.jpg',
        'https://img.youtube.com/vi/video4/maxresdefault.jpg', // ペア
        'https://img.youtube.com/vi/video5/maxresdefault.jpg',
        'https://img.youtube.com/vi/video5/maxresdefault.jpg', // ペア
        'https://img.youtube.com/vi/video6/maxresdefault.jpg',
        'https://img.youtube.com/vi/video6/maxresdefault.jpg', // ペア
      ]

      render(
        <MemoryGame
          thumbnails={beginnerThumbnails}
          difficulty="beginner"
        />
      )

      // 実際のゲームカード要素数を確認
      const cards = screen.getAllByTestId('game-card')
      expect(cards).toHaveLength(12) // APIから受け取った12枚

      // ?マークの数を確認（全てのカードが裏向きであることを確認）
      const questionMarks = screen.getAllByText('?')
      expect(questionMarks).toHaveLength(12)

      // 初期状態で画像が表示されていないことを確認
      const images = screen.queryAllByTestId('next-image')
      expect(images).toHaveLength(0)

      console.log('🔍 初級テスト:', {
        thumbnails: beginnerThumbnails.length,
        expectedCards: 12,
        actualCards: cards.length,
        questionMarks: questionMarks.length,
        images: images.length
      })
    })

    it('中級: APIが返すペア済みサムネイルから正確に16枚のカードが生成される', async () => {
      // APIは既にペア化されたサムネイルを返す（8ペア=16枚分）
      const intermediateThumbnails = Array.from({ length: 16 }, (_, i) => {
        const videoNum = Math.floor(i / 2) + 1 // 各ビデオが2回ずつ
        return `https://img.youtube.com/vi/video${videoNum}/maxresdefault.jpg`
      })

      render(
        <MemoryGame
          thumbnails={intermediateThumbnails}
          difficulty="intermediate"
        />
      )

      const cards = screen.getAllByTestId('game-card')
      expect(cards).toHaveLength(16) // APIから受け取った16枚

      const questionMarks = screen.getAllByText('?')
      expect(questionMarks).toHaveLength(16)

      console.log('🔍 中級テスト:', {
        thumbnails: intermediateThumbnails.length,
        expectedCards: 16,
        actualCards: cards.length,
        questionMarks: questionMarks.length
      })
    })

    it('上級: APIが返すペア済みサムネイルから正確に24枚のカードが生成される', async () => {
      // APIは既にペア化されたサムネイルを返す（12ペア=24枚分）
      const advancedThumbnails = Array.from({ length: 24 }, (_, i) => {
        const videoNum = Math.floor(i / 2) + 1 // 各ビデオが2回ずつ
        return `https://img.youtube.com/vi/video${videoNum}/maxresdefault.jpg`
      })

      render(
        <MemoryGame
          thumbnails={advancedThumbnails}
          difficulty="advanced"
        />
      )

      const cards = screen.getAllByTestId('game-card')
      expect(cards).toHaveLength(24) // APIから受け取った24枚

      const questionMarks = screen.getAllByText('?')
      expect(questionMarks).toHaveLength(24)

      console.log('🔍 上級テスト:', {
        thumbnails: advancedThumbnails.length,
        expectedCards: 24,
        actualCards: cards.length,
        questionMarks: questionMarks.length
      })
    })

    it('✅ 修正確認: APIが正しい枚数のサムネイルを返す場合', async () => {
      // 修正後: APIが正しく12枚のペア化されたサムネイルを返す
      const correctThumbnails = Array.from({ length: 12 }, (_, i) => {
        const videoNum = Math.floor(i / 2) + 1 // 各ビデオが2回ずつ
        return `https://img.youtube.com/vi/video${videoNum}/maxresdefault.jpg`
      })

      render(
        <MemoryGame
          thumbnails={correctThumbnails}
          difficulty="beginner"
        />
      )

      const cards = screen.getAllByTestId('game-card')

      console.log('✅ 修正確認テスト:', {
        thumbnails: correctThumbnails.length,
        actualCards: cards.length,
        expectedCards: 12,
        isCorrect: cards.length === 12
      })

      // 正しく12枚のカードが生成される
      expect(cards.length).toBe(12)
    })
  })

  describe('🔍 カード表示機能のテスト', () => {
    // ペア化されたテストサムネイル（6枚=3ペア）
    const testThumbnails = [
      'https://img.youtube.com/vi/video1/maxresdefault.jpg',
      'https://img.youtube.com/vi/video1/maxresdefault.jpg', // ペア
      'https://img.youtube.com/vi/video2/maxresdefault.jpg',
      'https://img.youtube.com/vi/video2/maxresdefault.jpg', // ペア
      'https://img.youtube.com/vi/video3/maxresdefault.jpg',
      'https://img.youtube.com/vi/video3/maxresdefault.jpg', // ペア
    ]

    it('カードクリック時の状態変化を詳細に確認', async () => {
      render(
        <MemoryGame
          thumbnails={testThumbnails}
          difficulty="beginner"
        />
      )

      // 初期状態の確認
      const cards = screen.getAllByTestId('game-card')
      const firstCard = cards[0]

      console.log('🔍 クリック前の状態:', {
        cardCount: cards.length,
        questionMarks: screen.getAllByText('?').length,
        images: screen.queryAllByRole('img').length
      })

      // カードクリック前は?マークが表示されている
      expect(firstCard).toHaveTextContent('?')
      expect(screen.queryAllByRole('img')).toHaveLength(0)

      // カードをクリック
      await act(async () => {
        fireEvent.click(firstCard)
      })

      console.log('🔍 クリック直後の状態:', {
        questionMarks: screen.getAllByText('?').length,
        images: screen.queryAllByRole('img').length
      })

      // クリック後は画像が表示され、?マークが消える
      await waitFor(() => {
        const images = screen.queryAllByRole('img')
        const remainingQuestionMarks = screen.getAllByText('?')

        console.log('🔍 waitFor内の状態:', {
          images: images.length,
          questionMarks: remainingQuestionMarks.length,
          expectedImages: 1,
          expectedQuestionMarks: 5 // 6枚中1枚がクリックされたので5枚
        })

        expect(images.length).toBe(1) // 1枚の画像が表示される
        expect(remainingQuestionMarks.length).toBe(5) // 残り5枚は?マーク
      })
    })

    it('✅ 修正確認: カードをクリックすると画像が正しく表示される', async () => {
      render(
        <MemoryGame
          thumbnails={testThumbnails}
          difficulty="beginner"
        />
      )

      const cards = screen.getAllByTestId('game-card')
      const firstCard = cards[0]

      // カードをクリック
      await act(async () => {
        fireEvent.click(firstCard)
      })

      // 画像が表示されることを確認（修正済み）
      await waitFor(() => {
        const images = screen.queryAllByRole('img')

        console.log('✅ 画像表示修正確認テスト:', {
          clickedCard: firstCard.textContent,
          imagesFound: images.length,
          expectedMinimum: 1,
          isFixed: images.length > 0
        })

        expect(images.length).toBeGreaterThan(0) // 画像が正しく表示される
      }, { timeout: 2000 })
    })

    it('画像のsrcとalt属性が正しく設定されているか確認', async () => {
      render(
        <MemoryGame
          thumbnails={testThumbnails}
          difficulty="beginner"
        />
      )

      const cards = screen.getAllByTestId('game-card')
      const firstCard = cards[0]

      await act(async () => {
        fireEvent.click(firstCard)
      })

      await waitFor(() => {
        const images = screen.queryAllByRole('img')
        if (images.length > 0) {
          const firstImage = images[0]
          const src = firstImage.getAttribute('src')
          const alt = firstImage.getAttribute('alt')

          console.log('🔍 画像属性確認:', {
            src,
            alt,
            expectedSrcPattern: /video\d+/,
            hasValidSrc: testThumbnails.some(thumb => thumb === src)
          })

          expect(src).toBeTruthy()
          expect(alt).toBeTruthy()
          expect(testThumbnails).toContain(src!) // srcがtestThumbnails内に存在する
        }
      })
    })
  })

  describe('🔍 データフローと状態管理の詳細確認', () => {
    it('thumbnails配列がカード生成時に正しく処理されているか', async () => {
      // APIからペア化されたサムネイルを受け取る
      const thumbnails = [
        'https://img.youtube.com/vi/video1/maxresdefault.jpg',
        'https://img.youtube.com/vi/video1/maxresdefault.jpg', // ペア
        'https://img.youtube.com/vi/video2/maxresdefault.jpg',
        'https://img.youtube.com/vi/video2/maxresdefault.jpg', // ペア
      ]

      render(
        <MemoryGame
          thumbnails={thumbnails}
          difficulty="beginner"
        />
      )

      // 4枚のサムネイル（2ペア）→ 4枚のカードが期待される
      const cards = screen.getAllByTestId('game-card')
      expect(cards).toHaveLength(4)

      // カード生成ロジックの確認：APIから受け取ったサムネイルがそのままカードになる
      console.log('🔍 カード生成確認:', {
        thumbnails: thumbnails.length,
        expectedCards: thumbnails.length,
        actualCards: cards.length,
        shouldMatch: cards.length === thumbnails.length
      })

      // 基本的な期待値確認
      expect(cards.length).toBe(thumbnails.length) // 受け取ったサムネイル数と同じ

      // 1枚だけクリックして画像表示を確認
      await act(async () => {
        fireEvent.click(cards[0])
      })

      await waitFor(() => {
        const images = screen.getAllByRole('img')

        console.log('🔍 カードクリック確認:', {
          imagesDisplayed: images.length,
          expectedMinimum: 1,
          firstImageSrc: images[0]?.getAttribute('src')
        })

        expect(images.length).toBeGreaterThan(0) // 最低1枚の画像が表示される

        // 表示された画像のsrcがサムネイル配列に含まれていることを確認
        const firstImageSrc = images[0].getAttribute('src')
        expect(thumbnails).toContain(firstImageSrc)
      })
    })

    it('グリッドレイアウトが難易度に応じて正しく適用されているか', async () => {
      const { rerender } = render(
        <MemoryGame
          thumbnails={Array.from({ length: 12 }, (_, i) => {
            const videoNum = Math.floor(i / 2) + 1
            return `https://img.youtube.com/vi/video${videoNum}/maxresdefault.jpg`
          })}
          difficulty="beginner"
        />
      )

      // 初級: grid-cols-4
      let grid = document.querySelector('.grid')
      expect(grid).toHaveClass('grid-cols-4')

      rerender(
        <MemoryGame
          thumbnails={Array.from({ length: 16 }, (_, i) => {
            const videoNum = Math.floor(i / 2) + 1
            return `https://img.youtube.com/vi/video${videoNum}/maxresdefault.jpg`
          })}
          difficulty="intermediate"
        />
      )

      // 中級: grid-cols-4
      grid = document.querySelector('.grid')
      expect(grid).toHaveClass('grid-cols-4')

      rerender(
        <MemoryGame
          thumbnails={Array.from({ length: 24 }, (_, i) => {
            const videoNum = Math.floor(i / 2) + 1
            return `https://img.youtube.com/vi/video${videoNum}/maxresdefault.jpg`
          })}
          difficulty="advanced"
        />
      )

      // 上級: grid-cols-6
      grid = document.querySelector('.grid')
      expect(grid).toHaveClass('grid-cols-6')
    })
  })
})

// React のインポートを追加（TypeScript の JSX 変換用）
import React from 'react'
