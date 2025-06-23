import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MemoryPage from '../page'
import { useMemoryThumbnails } from '@/hooks/useApi'
import { useConfig } from '@/contexts/ConfigContext'

// Mock hooks
jest.mock('@/hooks/useApi')
jest.mock('@/contexts/ConfigContext')

// Mock components
jest.mock('@/components/layout/MainLayout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="main-layout">{children}</div>
  ),
}))

jest.mock('@/components/memory/MemoryGame', () => ({
  MemoryGame: ({
    thumbnails,
    onGameComplete,
    difficulty,
    gameStats
  }: {
    thumbnails?: string[]
    onGameComplete?: (moves: number, time: number) => void
    difficulty: string
    gameStats?: { moves: number; time: number; score: number } | null
  }) => (
    <div data-testid="memory-game">
      <div data-testid="thumbnails-count">{thumbnails?.length || 0}</div>
      <div data-testid="difficulty">{difficulty}</div>
      <div data-testid="game-stats">{gameStats ? JSON.stringify(gameStats) : 'null'}</div>
      <button
        data-testid="mock-complete-game"
        onClick={() => onGameComplete?.(10, 30)}
      >
        Complete Game
      </button>
    </div>
  ),
}))

jest.mock('@/components/common/Loading', () => ({
  Loading: ({ label }: { label?: string }) => (
    <div data-testid="loading">{label || 'Loading...'}</div>
  ),
}))

jest.mock('@/components/common/ErrorMessage', () => ({
  ErrorMessage: ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
    <div data-testid="error-message">
      <span>{message}</span>
      {onRetry && <button onClick={onRetry} data-testid="retry-button">Retry</button>}
    </div>
  ),
}))

// Mock HeroUI components
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
        data-testid="card"
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
  Button: ({ children, onPress, color, variant, size, ...props }: React.PropsWithChildren<{
    onPress?: () => void
    color?: string
    variant?: string
    size?: string
    [key: string]: unknown
  }>) => (
    <button
      onClick={onPress}
      data-testid="button"
      data-color={color}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
  Modal: ({ children, isOpen, className, ...props }: React.PropsWithChildren<{
    isOpen?: boolean
    onClose?: () => void
    isDismissable?: boolean
    hideCloseButton?: boolean
    size?: string
    className?: string
    classNames?: Record<string, string>
    [key: string]: unknown
  }>) => {
    // DOM に渡すべきでないプロパティを除外
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { isDismissable, hideCloseButton, size, classNames, onClose, ...validProps } = props
    return isOpen ? <div data-testid="modal" className={className} {...validProps}>{children}</div> : null
  },
  ModalContent: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="modal-content" {...props}>{children}</div>
  ),
  ModalHeader: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="modal-header" {...props}>{children}</div>
  ),
  ModalBody: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="modal-body" {...props}>{children}</div>
  ),
  ModalFooter: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="modal-footer" {...props}>{children}</div>
  ),
}))

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  PuzzlePieceIcon: () => <div data-testid="puzzle-piece-icon" />,
  TrophyIcon: () => <div data-testid="trophy-icon" />,
  SparklesIcon: () => <div data-testid="sparkles-icon" />,
  FireIcon: () => <div data-testid="fire-icon" />,
  BoltIcon: () => <div data-testid="bolt-icon" />,
}))

const mockUseMemoryThumbnails = useMemoryThumbnails as jest.MockedFunction<typeof useMemoryThumbnails>
const mockUseConfig = useConfig as jest.MockedFunction<typeof useConfig>

describe('MemoryPage', () => {
  const mockThumbnails = {
    thumbnails: [
      'https://img.youtube.com/vi/video1/maxresdefault.jpg',
      'https://img.youtube.com/vi/video2/maxresdefault.jpg',
      'https://img.youtube.com/vi/video3/maxresdefault.jpg',
      'https://img.youtube.com/vi/video4/maxresdefault.jpg',
      'https://img.youtube.com/vi/video5/maxresdefault.jpg',
      'https://img.youtube.com/vi/video6/maxresdefault.jpg',
    ]
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseConfig.mockReturnValue({
      config: { NEXT_PUBLIC_API_URL: 'http://localhost:8000' },
      isLoading: false,
      error: null,
    })
    mockUseMemoryThumbnails.mockReturnValue({
      data: mockThumbnails,
      error: null,
      isLoading: false,
      mutate: jest.fn(),
    })
  })

  describe('初期表示', () => {
    it('難易度選択モーダルが表示される', () => {
      render(<MemoryPage />)

      expect(screen.getByTestId('modal')).toBeInTheDocument()
      expect(screen.getByText('難易度を選択してください')).toBeInTheDocument()
      expect(screen.getByText('あなたのレベルに合わせて挑戦しよう！')).toBeInTheDocument()
    })

    it('3つの難易度選択肢が表示される', () => {
      render(<MemoryPage />)

      expect(screen.getByText('初級')).toBeInTheDocument()
      expect(screen.getByText('中級')).toBeInTheDocument()
      expect(screen.getByText('上級')).toBeInTheDocument()
    })

    it('各難易度の説明が表示される', () => {
      render(<MemoryPage />)

      expect(screen.getByText('6ペア (12枚) - 気軽に楽しもう!')).toBeInTheDocument()
      expect(screen.getByText('8ペア (16枚) - ちょうどいい挑戦!')).toBeInTheDocument()
      expect(screen.getByText('12ペア (24枚) - 真の実力を試そう!')).toBeInTheDocument()
    })

    it('キーボードショートカットの説明が表示される', () => {
      render(<MemoryPage />)

      expect(screen.getByText('👆 タップして選択してください 👆')).toBeInTheDocument()
      expect(screen.getByText(/キーボード:/)).toBeInTheDocument()
    })
  })

  describe('難易度選択', () => {
    it('初級を選択するとモーダルが閉じて6ペア用のゲームが開始される', async () => {
      render(<MemoryPage />)

      const beginnerCard = screen.getByText('初級').closest('[data-testid="card"]')
      expect(beginnerCard).toBeInTheDocument()

      fireEvent.click(beginnerCard!)

      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
      })

      expect(screen.getByTestId('difficulty')).toHaveTextContent('beginner')
    })

    it('中級を選択すると8ペア用のゲームが開始される', async () => {
      render(<MemoryPage />)

      const intermediateCard = screen.getByText('中級').closest('[data-testid="card"]')
      fireEvent.click(intermediateCard!)

      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
      })

      expect(screen.getByTestId('difficulty')).toHaveTextContent('intermediate')
    })

    it('上級を選択すると12ペア用のゲームが開始される', async () => {
      render(<MemoryPage />)

      const advancedCard = screen.getByText('上級').closest('[data-testid="card"]')
      fireEvent.click(advancedCard!)

      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
      })

      expect(screen.getByTestId('difficulty')).toHaveTextContent('advanced')
    })

    it('キーボード入力で難易度を選択できる', async () => {
      render(<MemoryPage />)

      // '1'キーで初級選択
      fireEvent.keyDown(window, { key: '1' })

      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
      })

      expect(screen.getByTestId('difficulty')).toHaveTextContent('beginner')
    })
  })

  describe('ゲーム設定', () => {
    it('難易度選択後に現在の難易度が表示される', async () => {
      render(<MemoryPage />)

      const beginnerCard = screen.getByText('初級').closest('[data-testid="card"]')
      fireEvent.click(beginnerCard!)

      await waitFor(() => {
        expect(screen.getByText('現在の難易度: 初級')).toBeInTheDocument()
      })
    })

    it('リセットボタンが機能する', async () => {
      const mockMutate = jest.fn()
      mockUseMemoryThumbnails.mockReturnValue({
        data: mockThumbnails,
        error: null,
        isLoading: false,
        mutate: mockMutate,
      })

      render(<MemoryPage />)

      // 難易度選択
      const beginnerCard = screen.getByText('初級').closest('[data-testid="card"]')
      fireEvent.click(beginnerCard!)

      // ゲーム完了を先にシミュレート
      await waitFor(() => {
        const completeButton = screen.getByTestId('mock-complete-game')
        fireEvent.click(completeButton)
      })

      // ゲーム完了後にリセットボタンをクリック
      await waitFor(() => {
        const resetButton = screen.getByText('🔄 リセット')
        fireEvent.click(resetButton)
      })

      expect(mockMutate).toHaveBeenCalled()
    })

    it('難易度変更ボタンが機能する', async () => {
      render(<MemoryPage />)

      // 難易度選択
      const beginnerCard = screen.getByText('初級').closest('[data-testid="card"]')
      fireEvent.click(beginnerCard!)

      await waitFor(() => {
        const changeDifficultyButton = screen.getByText('難易度変更')
        fireEvent.click(changeDifficultyButton)
      })

      // モーダルが再表示される
      expect(screen.getByTestId('modal')).toBeInTheDocument()
    })
  })

  describe('スコア計算', () => {
    it('ゲーム完了時にスコアが正しく計算される', async () => {
      render(<MemoryPage />)

      // 難易度選択
      const beginnerCard = screen.getByText('初級').closest('[data-testid="card"]')
      fireEvent.click(beginnerCard!)

      await waitFor(() => {
        // ゲーム完了をシミュレート
        const completeButton = screen.getByTestId('mock-complete-game')
        fireEvent.click(completeButton)
      })

      // スコアが表示される
      await waitFor(() => {
        expect(screen.getByText('🎉 ゲームクリア！')).toBeInTheDocument()
        expect(screen.getByText('素晴らしいプレイでした！')).toBeInTheDocument()
      })

      // 手数、時間が表示される
      expect(screen.getByText('10')).toBeInTheDocument() // 手数
      expect(screen.getByText('0:30')).toBeInTheDocument() // 時間
    })

    it('スコア計算ロジックが正しく動作する（時間ボーナス）', async () => {
      render(<MemoryPage />)

      const beginnerCard = screen.getByText('初級').closest('[data-testid="card"]')
      fireEvent.click(beginnerCard!)

      await waitFor(() => {
        const completeButton = screen.getByTestId('mock-complete-game')
        fireEvent.click(completeButton)
      })

      // スコアの計算確認（実際の計算結果は実装依存）
      await waitFor(() => {
        const gameStatsElement = screen.getByTestId('game-stats')
        const gameStats = JSON.parse(gameStatsElement.textContent!)
        expect(gameStats.score).toBeGreaterThan(0)
      })
    })
  })

  describe('エラーハンドリング', () => {
    it('設定読み込みエラー時にエラーメッセージが表示される', () => {
      mockUseConfig.mockReturnValue({
        config: null,
        isLoading: false,
        error: new Error('Failed to load config'),
      })

      render(<MemoryPage />)

      expect(screen.getByTestId('error-message')).toBeInTheDocument()
      expect(screen.getByText('設定の読み込みに失敗しました。ページを再読み込みしてください。')).toBeInTheDocument()
    })

    it('サムネイル読み込みエラー時にエラーメッセージが表示される', async () => {
      mockUseMemoryThumbnails.mockReturnValue({
        data: null,
        error: new Error('Failed to load thumbnails'),
        isLoading: false,
        mutate: jest.fn(),
      })

      render(<MemoryPage />)

      // 難易度選択
      const beginnerCard = screen.getByText('初級').closest('[data-testid="card"]')
      fireEvent.click(beginnerCard!)

      await waitFor(() => {
        expect(screen.getByText('ゲーム用画像の読み込みに失敗しました')).toBeInTheDocument()
      })
    })

    it('ローディング状態が正しく表示される', () => {
      mockUseConfig.mockReturnValue({
        config: null,
        isLoading: true,
        error: null,
      })

      render(<MemoryPage />)

      expect(screen.getByTestId('loading')).toBeInTheDocument()
    })

    it('サムネイル読み込み中のローディングが表示される', async () => {
      mockUseMemoryThumbnails.mockReturnValue({
        data: null,
        error: null,
        isLoading: true,
        mutate: jest.fn(),
      })

      render(<MemoryPage />)

      // 難易度選択
      const beginnerCard = screen.getByText('初級').closest('[data-testid="card"]')
      fireEvent.click(beginnerCard!)

      await waitFor(() => {
        expect(screen.getByText('ゲーム用画像を準備中...')).toBeInTheDocument()
      })
    })
  })

  describe('API連携', () => {
    it('選択した難易度に応じて正しいペア数でAPIが呼ばれる', async () => {
      render(<MemoryPage />)

      // 初級選択（6ペア）
      const beginnerCard = screen.getByText('初級').closest('[data-testid="card"]')
      fireEvent.click(beginnerCard!)

      await waitFor(() => {
        expect(mockUseMemoryThumbnails).toHaveBeenCalledWith(6)
      })
    })

    it('難易度変更時に新しいペア数でAPIが呼ばれる', async () => {
      render(<MemoryPage />)

      // 初級選択
      const beginnerCard = screen.getByText('初級').closest('[data-testid="card"]')
      fireEvent.click(beginnerCard!)

      await waitFor(() => {
        // 難易度変更
        const changeDifficultyButton = screen.getByText('難易度変更')
        fireEvent.click(changeDifficultyButton)
      })

      // 中級選択
      const intermediateCard = screen.getByText('中級').closest('[data-testid="card"]')
      fireEvent.click(intermediateCard!)

      await waitFor(() => {
        expect(mockUseMemoryThumbnails).toHaveBeenCalledWith(8)
      })
    })
  })
})

import React from 'react'
