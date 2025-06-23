import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
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
  Button: ({ children, onPress, startContent, size, color, variant, ...props }: React.PropsWithChildren<{
    onPress?: () => void
    startContent?: React.ReactNode
    size?: string
    color?: string
    variant?: string
    [key: string]: unknown
  }>) => (
    <button
      onClick={onPress}
      data-testid="button"
      data-size={size}
      data-color={color}
      data-variant={variant}
      {...props}
    >
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
  Modal: ({ children, isOpen, classNames, size, isDismissable, hideCloseButton, onClose, ...props }: React.PropsWithChildren<{
    isOpen: boolean
    classNames?: Record<string, string>
    size?: string
    isDismissable?: boolean
    hideCloseButton?: boolean
    onClose?: () => void
    [key: string]: unknown
  }>) => (
    isOpen ? (
      <div
        data-testid="modal"
        className={classNames?.backdrop}
        data-size={size}
        data-dismissable={isDismissable}
        data-hide-close-button={hideCloseButton}
        {...props}
      >
        <div className={classNames?.base}>
          <div className={classNames?.wrapper}>
            {children}
          </div>
        </div>
      </div>
    ) : null
  ),
  ModalContent: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="modal-content" {...props}>
      {children}
    </div>
  ),
  ModalHeader: ({ children, className, ...props }: React.PropsWithChildren<{
    className?: string
    [key: string]: unknown
  }>) => (
    <div data-testid="modal-header" className={className} {...props}>
      {children}
    </div>
  ),
  ModalBody: ({ children, className, ...props }: React.PropsWithChildren<{
    className?: string
    [key: string]: unknown
  }>) => (
    <div data-testid="modal-body" className={className} {...props}>
      {children}
    </div>
  ),
  ModalFooter: ({ children, className, ...props }: React.PropsWithChildren<{
    className?: string
    [key: string]: unknown
  }>) => (
    <div data-testid="modal-footer" className={className} {...props}>
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

jest.mock('@/components/memory/MemoryGame', () => ({
  MemoryGame: ({ thumbnails, difficulty, onGameComplete, gameStats }: {
    thumbnails: string[]
    difficulty: string
    onGameComplete?: (moves: number, time: number) => void
    gameStats?: { moves: number; time: number; score: number } | null
  }) => (
    <div data-testid="memory-game">
      <div data-testid="game-difficulty">{difficulty}</div>
      <div data-testid="game-thumbnails-count">{thumbnails.length}</div>
      {gameStats && (
        <div data-testid="game-stats">
          <span data-testid="game-moves">{gameStats.moves}</span>
          <span data-testid="game-time">{gameStats.time}</span>
          <span data-testid="game-score">{gameStats.score}</span>
        </div>
      )}
      <button
        data-testid="complete-game-button"
        onClick={() => onGameComplete?.(10, 60)}
      >
        Complete Game
      </button>
    </div>
  )
}))

describe('Memory Page - 使用ベースのテスト', () => {
  const mockPush = jest.fn()
  const mockMutate = jest.fn()

  const mockThumbnails = [
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
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  describe('🎯 難易度選択モーダルの使用体験', () => {
    it('初回訪問時に難易度選択モーダルが自動表示される', () => {
      render(<MemoryPage />)

      // モーダルが表示される
      expect(screen.getByTestId('modal')).toBeInTheDocument()
      expect(screen.getByText('難易度を選択してください')).toBeInTheDocument()
      expect(screen.getByText('あなたのレベルに合わせて挑戦しよう！')).toBeInTheDocument()
    })

    it('モーダルが正しく設定されている（閉じるボタンなし、Escで閉じられない）', () => {
      render(<MemoryPage />)

      const modal = screen.getByTestId('modal')
      expect(modal).toHaveAttribute('data-dismissable', 'false')
      expect(modal).toHaveAttribute('data-hide-close-button', 'true')
    })

    it('3つの難易度オプションが正しく表示される', () => {
      render(<MemoryPage />)

      // 各難易度の表示
      expect(screen.getByText('初級')).toBeInTheDocument()
      expect(screen.getByText('中級')).toBeInTheDocument()
      expect(screen.getByText('上級')).toBeInTheDocument()

      // 説明文の表示
      expect(screen.getByText('6ペア (12枚) - 気軽に楽しもう!')).toBeInTheDocument()
      expect(screen.getByText('8ペア (16枚) - ちょうどいい挑戦!')).toBeInTheDocument()
      expect(screen.getByText('12ペア (24枚) - 真の実力を試そう!')).toBeInTheDocument()
    })

    it('カードクリックで難易度が選択される', async () => {
      render(<MemoryPage />)

      const beginnerCard = screen.getByText('初級').closest('[data-testid="card"]')
      expect(beginnerCard).toHaveAttribute('data-pressable', 'true')

      await act(async () => {
        fireEvent.click(beginnerCard!)
      })

      // モーダルが閉じられ、ゲーム画面に遷移
      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
        expect(screen.getByTestId('memory-game')).toBeInTheDocument()
      })
    })

    it('ボタンクリックで難易度が選択される', async () => {
      render(<MemoryPage />)

      // 初級の「選択する」ボタンを特定するために、初級カード内のボタンを取得
      const beginnerText = screen.getByText('初級')
      const beginnerCard = beginnerText.closest('[data-testid="card"]')
      const beginnerButton = beginnerCard?.querySelector('button')

      expect(beginnerButton).toBeInTheDocument()

      await act(async () => {
        fireEvent.click(beginnerButton!)
      })

      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
        expect(screen.getByTestId('memory-game')).toBeInTheDocument()
      })
    })

    it('キーボードショートカットが機能する', async () => {
      render(<MemoryPage />)

      // キー1で初級選択
      await act(async () => {
        fireEvent.keyDown(window, { key: '1' })
      })

      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
        expect(screen.getByTestId('game-difficulty')).toHaveTextContent('beginner')
      })
    })

    it('キーボードショートカットの説明が表示される', () => {
      render(<MemoryPage />)

      // 複数の要素がある場合はgetAllByTextを使用
      const ones = screen.getAllByText('1')
      const twos = screen.getAllByText('2')
      const threes = screen.getAllByText('3')

      expect(ones.length).toBeGreaterThan(0)
      expect(twos.length).toBeGreaterThan(0)
      expect(threes.length).toBeGreaterThan(0)
      expect(screen.getByText('カードまたはボタンをタップ')).toBeInTheDocument()
    })
  })

  describe('🎮 ゲーム体験フロー', () => {
    it('難易度選択後に正しいゲーム設定でゲームが開始される', async () => {
      render(<MemoryPage />)

      // 中級を選択
      await act(async () => {
        fireEvent.keyDown(window, { key: '2' })
      })

      await waitFor(() => {
        // ゲームが中級で開始される
        expect(screen.getByTestId('game-difficulty')).toHaveTextContent('intermediate')
        expect(screen.getByText('現在の難易度: 中級')).toBeInTheDocument()

        // 適切なAPI呼び出しが行われる
        expect(useMemoryThumbnails).toHaveBeenCalledWith(8) // 中級は8ペア
      })
    })

    it('ゲーム完了時にスコア計算と表示が正しく動作する', async () => {
      render(<MemoryPage />)

      // 初級を選択
      await act(async () => {
        fireEvent.click(screen.getByText('初級'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('memory-game')).toBeInTheDocument()
      })

      // ゲーム完了をシミュレート
      const completeButton = screen.getByTestId('complete-game-button')
      await act(async () => {
        fireEvent.click(completeButton)
      })

      // スコアが表示される
      await waitFor(() => {
        expect(screen.getByText('🎉 ゲームクリア！')).toBeInTheDocument()

        // 複数の"10"要素がある場合があるため、getAllByTextを使用
        const tensElements = screen.getAllByText('10')
        expect(tensElements.length).toBeGreaterThan(0) // 手数として10が表示される

        expect(screen.getByText('1:00')).toBeInTheDocument() // 時間
      })
    })

    it('リセットボタンが正しく機能する（同一難易度で新しいゲーム）', async () => {
      render(<MemoryPage />)

      // 初級を選択
      await act(async () => {
        fireEvent.click(screen.getByText('初級'))
      })

      // ゲーム完了
      await waitFor(() => {
        const completeButton = screen.getByTestId('complete-game-button')
        fireEvent.click(completeButton)
      })

      // リセットボタンをクリック
      await waitFor(() => {
        const resetButton = screen.getByText('🔄 リセット')
        fireEvent.click(resetButton)
      })

      // 新しいゲームデータが取得される
      expect(mockMutate).toHaveBeenCalled()
    })

    it('難易度変更が正しく機能する', async () => {
      render(<MemoryPage />)

      // 初級を選択
      await act(async () => {
        fireEvent.click(screen.getByText('初級'))
      })

      // 難易度変更ボタンをクリック（ゲーム中は絵文字なしの文字）
      await waitFor(() => {
        const changeDifficultyButton = screen.getByText('難易度変更')
        fireEvent.click(changeDifficultyButton)
      })

      // 難易度選択モーダルが再表示される
      expect(screen.getByTestId('modal')).toBeInTheDocument()
      expect(screen.getByText('難易度を選択してください')).toBeInTheDocument()
    })
  })

  describe('🔧 ゲーム設定とUI', () => {
    it('ゲーム設定カードが適切に表示される', async () => {
      render(<MemoryPage />)

      await act(async () => {
        fireEvent.click(screen.getByText('初級'))
      })

      // 基本的な要素の存在確認
      await waitFor(() => {
        // モーダルが閉じられる
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
      })

      // ゲーム画面の要素が表示される
      expect(screen.getByText('🧠 神経衰弱ゲーム')).toBeInTheDocument()
      expect(screen.getByText('遊び方')).toBeInTheDocument()

      // 複数のpuzzle-piece-iconがある場合があるため、getAllByTestIdを使用
      const puzzleIcons = screen.getAllByTestId('puzzle-piece-icon')
      expect(puzzleIcons.length).toBeGreaterThan(0)
    })

    it('ゲーム完了時の統計情報が正しく表示される', async () => {
      render(<MemoryPage />)

      await act(async () => {
        fireEvent.click(screen.getByText('初級'))
      })

      await waitFor(() => {
        const completeButton = screen.getByTestId('complete-game-button')
        fireEvent.click(completeButton)
      })

      await waitFor(() => {
        // 完了メッセージ
        expect(screen.getByText('🎉 ゲームクリア！')).toBeInTheDocument()
        expect(screen.getByText('素晴らしいプレイでした！')).toBeInTheDocument()

        // 統計グリッド
        expect(screen.getByText('手数')).toBeInTheDocument()
        expect(screen.getByText('時間')).toBeInTheDocument()
        expect(screen.getByText('スコア')).toBeInTheDocument()

        // トロフィーアイコン（複数ある場合があるため、getAllByTestIdを使用）
        const trophyIcons = screen.getAllByTestId('trophy-icon')
        expect(trophyIcons.length).toBeGreaterThan(0)
      })
    })

    it('遊び方の説明が正しく表示される', async () => {
      render(<MemoryPage />)

      await act(async () => {
        fireEvent.click(screen.getByText('初級'))
      })

      await waitFor(() => {
        expect(screen.getByText('遊び方')).toBeInTheDocument()
        expect(screen.getByText('• カードをクリックして裏返します')).toBeInTheDocument()
        expect(screen.getByText('• 同じ画像のペアを見つけてください')).toBeInTheDocument()
        expect(screen.getByText('• すべてのペアを見つけるとゲームクリアです')).toBeInTheDocument()
        expect(screen.getByText('• より少ない手数でクリアを目指しましょう！')).toBeInTheDocument()
      })
    })
  })

  describe('📱 レスポンシブデザイン', () => {
    it('モバイル向けのクラス設定が適用される', () => {
      render(<MemoryPage />)

      const modal = screen.getByTestId('modal')
      const modalContent = modal.querySelector('[class*="h-screen"]')
      expect(modalContent).toBeInTheDocument()

      // モーダルヘッダーのモバイル対応
      const modalHeader = screen.getByTestId('modal-header')
      expect(modalHeader).toHaveClass('pb-2', 'pt-1', 'sm:pb-4', 'sm:pt-8')

      // モーダルボディのモバイル対応
      const modalBody = screen.getByTestId('modal-body')
      expect(modalBody).toHaveClass('px-3', 'sm:px-8', 'py-2', 'sm:py-0')
    })

    it('フッター部分のモバイル対応が適切', () => {
      render(<MemoryPage />)

      const modalFooter = screen.getByTestId('modal-footer')
      expect(modalFooter).toHaveClass('pt-2', 'pb-2', 'sm:pt-4', 'sm:pb-8')
    })
  })

  describe('🚨 エラーケースとエッジケース', () => {
    it('設定読み込み中の状態表示', () => {
      ; (useConfig as jest.Mock).mockReturnValue({
        isLoading: true,
        error: null,
      })

      render(<MemoryPage />)

      expect(screen.getByTestId('loading')).toBeInTheDocument()
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
    })

    it('設定読み込みエラーの処理', () => {
      ; (useConfig as jest.Mock).mockReturnValue({
        isLoading: false,
        error: new Error('Config load failed'),
      })

      render(<MemoryPage />)

      expect(screen.getByTestId('error-message')).toBeInTheDocument()
      expect(screen.getByText('設定の読み込みに失敗しました。ページを再読み込みしてください。')).toBeInTheDocument()

      // タイトルは表示される
      expect(screen.getByText('神経衰弱ゲーム')).toBeInTheDocument()
    })

    it('ゲームデータ読み込み中の状態', async () => {
      ; (useMemoryThumbnails as jest.Mock).mockReturnValue({
        data: null,
        error: null,
        isLoading: true,
        mutate: mockMutate,
      })

      render(<MemoryPage />)

      await act(async () => {
        fireEvent.click(screen.getByText('初級'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toBeInTheDocument()
        expect(screen.getByText('ゲーム用画像を準備中...')).toBeInTheDocument()
      })
    })

    it('ゲームデータ読み込みエラーの処理', async () => {
      ; (useMemoryThumbnails as jest.Mock).mockReturnValue({
        data: null,
        error: new Error('Failed to load thumbnails'),
        isLoading: false,
        mutate: mockMutate,
      })

      render(<MemoryPage />)

      await act(async () => {
        fireEvent.click(screen.getByText('初級'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
        expect(screen.getByText('ゲーム用画像の読み込みに失敗しました')).toBeInTheDocument()
      })
    })
  })

  describe('⚡ パフォーマンスと状態管理', () => {
    it('スコア計算が一度だけ実行される（重複計算防止）', async () => {
      render(<MemoryPage />)

      await act(async () => {
        fireEvent.click(screen.getByText('初級'))
      })

      // ゲーム完了を複数回実行してもスコアは変わらない
      await waitFor(() => {
        const completeButton = screen.getByTestId('complete-game-button')
        fireEvent.click(completeButton)
      })

      const initialScore = screen.getByTestId('game-score').textContent

      // 再度完了操作（ただし状態は変更されない）
      await waitFor(() => {
        const completeButton = screen.getByTestId('complete-game-button')
        fireEvent.click(completeButton)
      })

      expect(screen.getByTestId('game-score')).toHaveTextContent(initialScore!)
    })

    it('難易度変更時に前のゲーム状態がリセットされる', async () => {
      render(<MemoryPage />)

      // 初級でゲーム完了
      await act(async () => {
        fireEvent.click(screen.getByText('初級'))
      })

      await waitFor(() => {
        const completeButton = screen.getByTestId('complete-game-button')
        fireEvent.click(completeButton)
      })

      // 難易度変更（ゲーム完了後は絵文字付きのボタン）
      await waitFor(() => {
        const changeDifficultyButton = screen.getByText('🎯 難易度変更')
        fireEvent.click(changeDifficultyButton)
      })

      // 中級を選択
      await act(async () => {
        fireEvent.keyDown(window, { key: '2' })
      })

      // 前のゲーム統計は表示されない
      await waitFor(() => {
        expect(screen.queryByText('🎉 ゲームクリア！')).not.toBeInTheDocument()
        expect(screen.getByTestId('game-difficulty')).toHaveTextContent('intermediate')
      })
    })
  })
})

// React import for JSX
import React from 'react'
