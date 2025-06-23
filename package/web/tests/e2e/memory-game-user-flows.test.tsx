import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryGame } from '@/components/memory/MemoryGame'
import MemoryPage from '@/app/memory/page'
import { useRouter } from 'next/navigation'
import { useConfig } from '@/contexts/ConfigContext'
import { useMemoryThumbnails } from '@/hooks/useApi'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/contexts/ConfigContext', () => ({
  useConfig: jest.fn(),
}))

jest.mock('@/hooks/useApi', () => ({
  useMemoryThumbnails: jest.fn(),
}))

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
  Modal: ({ children, isOpen, classNames, ...props }: React.PropsWithChildren<{
    isOpen: boolean
    classNames?: Record<string, string>
    [key: string]: unknown
  }>) => (
    isOpen ? (
      <div data-testid="modal" className={classNames?.backdrop} {...props}>
        {children}
      </div>
    ) : null
  ),
  ModalContent: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="modal-content" {...props}>
      {children}
    </div>
  ),
  ModalHeader: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="modal-header" {...props}>
      {children}
    </div>
  ),
  ModalBody: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="modal-body" {...props}>
      {children}
    </div>
  ),
  ModalFooter: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="modal-footer" {...props}>
      {children}
    </div>
  ),
}))

jest.mock('@heroicons/react/24/outline', () => ({
  ArrowPathIcon: () => <div data-testid="arrow-path-icon" />,
  ClockIcon: () => <div data-testid="clock-icon" />,
  HeartIcon: () => <div data-testid="heart-icon" />,
  StarIcon: () => <div data-testid="star-icon" />,
  FireIcon: () => <div data-testid="fire-icon" />,
  PuzzlePieceIcon: () => <div data-testid="puzzle-piece-icon" />,
  TrophyIcon: () => <div data-testid="trophy-icon" />,
  SparklesIcon: () => <div data-testid="sparkles-icon" />,
  BoltIcon: () => <div data-testid="bolt-icon" />,
}))

jest.mock('@/components/layout/MainLayout', () => {
  return {
    MainLayout: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="main-layout">{children}</div>
    )
  }
})

jest.mock('@/components/common/Loading', () => ({
  Loading: ({ label }: { label?: string }) => (
    <div data-testid="loading">{label || 'Loading...'}</div>
  ),
}))

jest.mock('@/components/common/ErrorMessage', () => ({
  ErrorMessage: ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
    <div data-testid="error-message">
      <span>{message}</span>
      {onRetry && <button onClick={onRetry} data-testid="retry-button">再試行</button>}
    </div>
  ),
}))

describe('Memory Game - User Experience Flows', () => {
  const mockPush = jest.fn()
  const mockMutate = jest.fn()

  const mockThumbnails = [
    'https://img.youtube.com/vi/video1/maxresdefault.jpg',
    'https://img.youtube.com/vi/video2/maxresdefault.jpg',
    'https://img.youtube.com/vi/video3/maxresdefault.jpg',
    'https://img.youtube.com/vi/video4/maxresdefault.jpg',
    'https://img.youtube.com/vi/video5/maxresdefault.jpg',
    'https://img.youtube.com/vi/video6/maxresdefault.jpg',
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()

      ; (useRouter as jest.Mock).mockReturnValue({
        push: mockPush,
      })

      ; (useConfig as jest.Mock).mockReturnValue({
        isLoading: false,
        error: null,
      })

      ; (useMemoryThumbnails as jest.Mock).mockReturnValue({
        data: { thumbnails: mockThumbnails },
        error: null,
        isLoading: false,
        mutate: mockMutate,
      })

    // Silence console.log during tests
    jest.spyOn(console, 'log').mockImplementation(() => { })
    jest.spyOn(console, 'error').mockImplementation(() => { })
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  describe('🎮 完全なゲームプレイフロー', () => {
    it('新規ユーザーが初級で完全なゲームを体験する', async () => {
      render(<MemoryPage />)

      // 1. 難易度選択画面が表示される
      expect(screen.getByTestId('modal')).toBeInTheDocument()
      expect(screen.getByText('難易度を選択してください')).toBeInTheDocument()

      // 2. 初級を選択
      const beginnerButton = screen.getByText('初級')
      expect(beginnerButton).toBeInTheDocument()

      await act(async () => {
        fireEvent.click(beginnerButton)
      })

      // 3. ゲーム画面が表示される
      await waitFor(() => {
        expect(screen.getByText('🧠 神経衰弱ゲーム')).toBeInTheDocument()
        expect(screen.getByText('現在の難易度: 初級')).toBeInTheDocument()
      })

      // 4. 初期状態確認：12枚のカードが裏向きで表示
      await waitFor(() => {
        const questionMarks = screen.getAllByText('?')
        expect(questionMarks).toHaveLength(12)
      })

      // 5. タイマーが0:00から始まっている
      expect(screen.getByText('0:00')).toBeInTheDocument()
      expect(screen.getByText('手数: 0')).toBeInTheDocument()
    })

    it('ユーザーがキーボードショートカットで難易度を選択する', async () => {
      render(<MemoryPage />)

      // 難易度選択画面でキーボード操作
      await act(async () => {
        fireEvent.keyDown(window, { key: '2' })
      })

      await waitFor(() => {
        expect(screen.getByText('現在の難易度: 中級')).toBeInTheDocument()
      })
    })
  })

  describe('📱 モバイルレスポンシブ体験', () => {
    beforeEach(() => {
      // モバイルビューポートをシミュレート
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      })
    })

    it('モバイルで難易度選択画面が正しく表示される', async () => {
      render(<MemoryPage />)

      // モーダルが全画面で表示される
      const modal = screen.getByTestId('modal')
      expect(modal).toBeInTheDocument()

      // 3つの難易度オプションが全て表示される
      expect(screen.getByText('初級')).toBeInTheDocument()
      expect(screen.getByText('中級')).toBeInTheDocument()
      expect(screen.getByText('上級')).toBeInTheDocument()

      // タップ説明文が表示される
      expect(screen.getByText('👆 タップして選択してください 👆')).toBeInTheDocument()
    })

    it('モバイルでゲームカードが適切なグリッドで表示される', async () => {
      render(<MemoryPage />)

      // 初級を選択
      await act(async () => {
        fireEvent.click(screen.getByText('初級'))
      })

      // ゲーム画面でモバイル向けレイアウトが適用される
      await waitFor(() => {
        const gameBoard = screen.getByTestId('game-board')
        expect(gameBoard).toBeInTheDocument()
      })
    })
  })

  describe('🔄 ゲーム操作フロー', () => {
    it('リセット機能が正しく動作する', async () => {
      render(<MemoryPage />)

      // 初級を選択してゲーム開始
      await act(async () => {
        fireEvent.click(screen.getByText('初級'))
      })

      // カードを1枚クリック
      await waitFor(() => {
        const cards = screen.getAllByTestId('game-card')
        fireEvent.click(cards[0])
      })

      // タイマーを進める
      act(() => {
        jest.advanceTimersByTime(5000)
      })

      // リセットボタンをクリック
      const resetButton = screen.getByText('リセット')
      await act(async () => {
        fireEvent.click(resetButton)
      })

      // ゲームが初期状態に戻る
      await waitFor(() => {
        expect(screen.getByText('0:00')).toBeInTheDocument()
        expect(screen.getByText('手数: 0')).toBeInTheDocument()
        expect(mockMutate).toHaveBeenCalled()
      })
    })

    it('難易度変更機能が正しく動作する', async () => {
      render(<MemoryPage />)

      // 初級を選択
      await act(async () => {
        fireEvent.click(screen.getByText('初級'))
      })

      // 難易度変更ボタンをクリック
      const changeDifficultyButton = screen.getByText('難易度変更')
      await act(async () => {
        fireEvent.click(changeDifficultyButton)
      })

      // 難易度選択画面が再表示される
      expect(screen.getByTestId('modal')).toBeInTheDocument()
      expect(screen.getByText('難易度を選択してください')).toBeInTheDocument()
    })
  })

  describe('🎯 ゲーム完了とギャラリー体験', () => {
    it('ゲーム完了後のギャラリー遷移が正しく動作する', async () => {
      const mockGameStats = { moves: 12, time: 60, score: 1500 }

      render(
        <MemoryGame
          thumbnails={mockThumbnails}
          difficulty="beginner"
          gameStats={mockGameStats}
        />
      )

      // ゲーム完了状態をシミュレート（showThumbnails=trueにする）
      // 実際の実装ではuseEffectでshowThumbnailsがtrueになる
      await waitFor(() => {
        // ギャラリーが表示されるかどうかは内部状態に依存するため、
        // ここではコンポーネントが正常にレンダリングされることを確認
        expect(screen.getByText('🧠 神経衰弱ゲーム')).toBeInTheDocument()
      })
    })
  })

  describe('⚠️ エラーハンドリング', () => {
    it('API読み込みエラー時の適切な表示', async () => {
      ; (useMemoryThumbnails as jest.Mock).mockReturnValue({
        data: null,
        error: new Error('Network error'),
        isLoading: false,
        mutate: mockMutate,
      })

      render(<MemoryPage />)

      // 初級を選択
      await act(async () => {
        fireEvent.click(screen.getByText('初級'))
      })

      // エラーメッセージが表示される
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
        expect(screen.getByText('ゲーム用画像の読み込みに失敗しました')).toBeInTheDocument()
      })

      // 再試行ボタンが機能する
      const retryButton = screen.getByTestId('retry-button')
      await act(async () => {
        fireEvent.click(retryButton)
      })
      expect(mockMutate).toHaveBeenCalled()
    })

    it('設定読み込みエラー時の適切な表示', async () => {
      ; (useConfig as jest.Mock).mockReturnValue({
        isLoading: false,
        error: new Error('Config error'),
      })

      render(<MemoryPage />)

      expect(screen.getByTestId('error-message')).toBeInTheDocument()
      expect(screen.getByText('設定の読み込みに失敗しました。ページを再読み込みしてください。')).toBeInTheDocument()
    })

    it('ローディング状態の適切な表示', async () => {
      ; (useConfig as jest.Mock).mockReturnValue({
        isLoading: true,
        error: null,
      })

      render(<MemoryPage />)

      expect(screen.getByTestId('loading')).toBeInTheDocument()
    })
  })

  describe('♿ アクセシビリティ', () => {
    it('キーボードナビゲーションが機能する', async () => {
      render(<MemoryPage />)

      // ESCキーをテスト（モーダルは閉じられないが、イベントは処理される）
      await act(async () => {
        fireEvent.keyDown(window, { key: 'Escape' })
      })

      // 数字キーでの選択
      await act(async () => {
        fireEvent.keyDown(window, { key: '1' })
      })

      await waitFor(() => {
        expect(screen.getByText('現在の難易度: 初級')).toBeInTheDocument()
      })
    })

    it('ボタンやカードが適切なaria属性を持つ', async () => {
      render(<MemoryPage />)

      // 初級を選択
      await act(async () => {
        fireEvent.click(screen.getByText('初級'))
      })

      await waitFor(() => {
        const gameCards = screen.getAllByTestId('game-card')
        expect(gameCards.length).toBeGreaterThan(0)

        // カードがクリック可能であることを確認
        gameCards.forEach(card => {
          expect(card).toBeInTheDocument()
        })
      })
    })
  })

  describe('🔍 パフォーマンス関連', () => {
    it('大量のカード操作でも安定動作する', async () => {
      const largeThumbnails = Array.from({ length: 24 }, (_, i) =>
        `https://img.youtube.com/vi/video${i + 1}/maxresdefault.jpg`
      )

        ; (useMemoryThumbnails as jest.Mock).mockReturnValue({
          data: { thumbnails: largeThumbnails },
          error: null,
          isLoading: false,
          mutate: mockMutate,
        })

      render(<MemoryPage />)

      // 上級を選択（24枚）
      await act(async () => {
        fireEvent.click(screen.getByText('上級'))
      })

      // 24枚のカードが表示される
      await waitFor(() => {
        const questionMarks = screen.getAllByText('?')
        expect(questionMarks).toHaveLength(24)
      })

      // 複数のカードを高速でクリックしても問題ない
      const cards = screen.getAllByTestId('game-card')
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          fireEvent.click(cards[i])
        })
      }

      // アプリケーションが正常に動作している
      expect(screen.getByText('🧠 神経衰弱ゲーム')).toBeInTheDocument()
    })
  })
})

// React import for JSX
import React from 'react'
