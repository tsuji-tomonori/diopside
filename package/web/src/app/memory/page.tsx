'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { MemoryGame } from '@/components/memory/MemoryGame'
import { Loading } from '@/components/common/Loading'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { useMemoryThumbnails } from '@/hooks/useApi'
import { useConfig } from '@/contexts/ConfigContext'
import { Card, CardBody, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react'
import { PuzzlePieceIcon, TrophyIcon, SparklesIcon, FireIcon, BoltIcon } from '@heroicons/react/24/outline'

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

const DIFFICULTY_CONFIG = {
  beginner: { pairs: 6, label: '初級', icon: SparklesIcon, description: '6ペア (12枚) - 気軽に楽しもう!' },
  intermediate: { pairs: 8, label: '中級', icon: FireIcon, description: '8ペア (16枚) - ちょうどいい挑戦!' },
  advanced: { pairs: 12, label: '上級', icon: BoltIcon, description: '12ペア (24枚) - 真の実力を試そう!' }
}

export default function MemoryPage() {
  const { isLoading: configLoading, error: configError } = useConfig()
  const [difficulty, setDifficulty] = useState<DifficultyLevel | null>(null)
  const [showDifficultyModal, setShowDifficultyModal] = useState(true)
  const [gameStats, setGameStats] = useState<{ moves: number; time: number; score: number } | null>(null)

  const pairs = difficulty ? DIFFICULTY_CONFIG[difficulty].pairs : 6
  const { data, error, isLoading, mutate } = useMemoryThumbnails(pairs)

  // Debug API data
  if (data) {
    console.log('📊 API data received:')
    console.log('  - difficulty:', difficulty)
    console.log('  - pairs:', pairs)
    console.log('  - thumbnails_count:', data.thumbnails.length)
    console.log('  - thumbnails:', data.thumbnails)
  }

  const handleDifficultySelect = (selectedDifficulty: DifficultyLevel) => {
    console.log('🎯 Difficulty selected:')
    console.log('  - selectedDifficulty:', selectedDifficulty)
    console.log('  - pairs:', DIFFICULTY_CONFIG[selectedDifficulty].pairs)
    console.log('  - expectedCards:', DIFFICULTY_CONFIG[selectedDifficulty].pairs * 2)

    setDifficulty(selectedDifficulty)
    setShowDifficultyModal(false)
    setGameStats(null)
  }

  const calculateScore = (moves: number, time: number, pairs: number): number => {
    // ベーススコア（ペア数に基づく）
    const baseScore = pairs * 100
    // 時間ボーナス（早いほど高得点）
    const timeBonus = Math.max(0, 300 - time) * 2
    // 手数ボーナス（少ないほど高得点、理想手数の1.5倍以内でボーナス）
    const idealMoves = pairs
    const movesPenalty = Math.max(0, (moves - idealMoves) * 10)
    const movesBonus = Math.max(0, (idealMoves * 1.5 - moves) * 20)

    return Math.max(0, baseScore + timeBonus + movesBonus - movesPenalty)
  }

  const handleGameComplete = (moves: number, time: number) => {
    // スコアを一度だけ計算して固定
    if (!gameStats) {
      const score = calculateScore(moves, time, pairs)
      setGameStats({ moves, time, score })
    }
  }

  const handleNewGame = () => {
    mutate()
    setGameStats(null)
  }

  const handleChangeDifficulty = () => {
    setShowDifficultyModal(true)
    setGameStats(null)
  }

  // Keyboard shortcuts for difficulty selection
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!showDifficultyModal) return

      switch (event.key) {
        case '1':
          handleDifficultySelect('beginner')
          break
        case '2':
          handleDifficultySelect('intermediate')
          break
        case '3':
          handleDifficultySelect('advanced')
          break
        case 'Escape':
          // モーダルを閉じることはできないが、キーボードナビゲーションのためにハンドラを追加
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showDifficultyModal])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Show loading while config is loading
  if (configLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loading />
        </div>
      </MainLayout>
    )
  }

  // Show error if config failed to load
  if (configError) {
    return (
      <MainLayout>
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-purple-800 dark:text-purple-200 mb-4">
              神経衰弱ゲーム
            </h1>
            <ErrorMessage
              message="設定の読み込みに失敗しました。ページを再読み込みしてください。"
              onRetry={() => window.location.reload()}
            />
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      {/* Difficulty Selection Modal */}
      <Modal
        isOpen={showDifficultyModal}
        onClose={() => { }}
        isDismissable={false}
        hideCloseButton
        size="full"
        className="m-0"
        classNames={{
          base: "h-screen w-screen max-h-screen max-w-screen",
          body: "py-4 px-4 flex-1 overflow-y-auto",
          wrapper: "items-center justify-center p-0",
          backdrop: "bg-gradient-to-br from-purple-900/90 to-blue-900/90"
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-2 text-center pb-4 pt-8">
            <div className="text-4xl sm:text-6xl mb-2">🎮</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
              難易度を選択してください
            </h2>
            <p className="text-base sm:text-lg text-white/90 drop-shadow">
              あなたのレベルに合わせて挑戦しよう！
            </p>
          </ModalHeader>
          <ModalBody className="px-4 sm:px-8 flex-1 flex items-center justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full max-w-4xl">
              {Object.entries(DIFFICULTY_CONFIG).map(([key, config]) => {
                const IconComponent = config.icon
                const colorClasses = {
                  beginner: {
                    bg: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/30',
                    border: 'border-green-200 dark:border-green-700',
                    icon: 'bg-green-100 dark:bg-green-800',
                    iconColor: 'text-green-600 dark:text-green-400',
                    hover: 'hover:from-green-100 hover:to-green-150 dark:hover:from-green-800/30 dark:hover:to-green-700/40'
                  },
                  intermediate: {
                    bg: 'bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-800/30',
                    border: 'border-yellow-200 dark:border-yellow-700',
                    icon: 'bg-yellow-100 dark:bg-yellow-800',
                    iconColor: 'text-yellow-600 dark:text-yellow-400',
                    hover: 'hover:from-yellow-100 hover:to-orange-150 dark:hover:from-yellow-800/30 dark:hover:to-orange-700/40'
                  },
                  advanced: {
                    bg: 'bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900/20 dark:to-pink-800/30',
                    border: 'border-red-200 dark:border-red-700',
                    icon: 'bg-red-100 dark:bg-red-800',
                    iconColor: 'text-red-600 dark:text-red-400',
                    hover: 'hover:from-red-100 hover:to-pink-150 dark:hover:from-red-800/30 dark:hover:to-pink-700/40'
                  }
                }[key as keyof typeof DIFFICULTY_CONFIG]

                return (
                  <Card
                    key={key}
                    className={`cursor-pointer transition-all duration-300 transform hover:scale-105 active:scale-95 hover:shadow-2xl border-2 ${colorClasses.bg
                      } ${colorClasses.border} ${colorClasses.hover} animate-pulse-once`}
                    isPressable
                    onPress={() => handleDifficultySelect(key as DifficultyLevel)}
                  >
                    <CardBody className="p-4 sm:p-6 lg:p-8 text-center">
                      <div className="flex flex-col items-center space-y-4">
                        <div className={`p-3 sm:p-4 rounded-2xl ${colorClasses.icon} shadow-lg`}>
                          <IconComponent className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${colorClasses.iconColor}`} />
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-bold mb-2 text-gray-800 dark:text-gray-200">
                            {config.label}
                          </h3>
                          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                            {config.description}
                          </p>
                        </div>
                        <div className="mt-4">
                          <Button
                            className={`font-bold text-white shadow-lg text-sm sm:text-base ${key === 'beginner' ? 'bg-green-500 hover:bg-green-600' :
                              key === 'intermediate' ? 'bg-yellow-500 hover:bg-yellow-600' :
                                'bg-red-500 hover:bg-red-600'
                              }`}
                            size="lg"
                            onPress={() => handleDifficultySelect(key as DifficultyLevel)}
                          >
                            選択する
                          </Button>
                          <div className="mt-2">
                            <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono">
                              {key === 'beginner' ? '1' : key === 'intermediate' ? '2' : '3'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                )
              })}
            </div>
          </ModalBody>
          <ModalFooter className="justify-center pt-4 pb-8">
            <div className="text-center">
              <div className="animate-bounce mb-4">
                <p className="text-lg font-semibold text-white drop-shadow-lg">
                  👆 タップして選択してください 👆
                </p>
              </div>
              <p className="text-sm text-white/80 drop-shadow mb-2">
                ✨ いつでも難易度は変更できます
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-white/70 drop-shadow">
                <span>カードまたはボタンをタップ</span>
                <span className="hidden sm:inline">•</span>
                <span>キーボード: <kbd className="bg-white/20 text-white px-1 rounded">1</kbd> <kbd className="bg-white/20 text-white px-1 rounded">2</kbd> <kbd className="bg-white/20 text-white px-1 rounded">3</kbd></span>
              </div>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-purple-800 dark:text-purple-200 mb-4">
            🧠 神経衰弱ゲーム
          </h1>
          <p className="text-lg text-purple-600 dark:text-purple-300 mb-8">
            白雪巴さんの動画サムネイルで神経衰弱を楽しもう
          </p>
          {difficulty && (
            <div className="inline-flex items-center space-x-2 bg-purple-100 dark:bg-purple-900 px-4 py-2 rounded-full">
              <span className="text-purple-800 dark:text-purple-200 font-semibold">
                現在の難易度: {DIFFICULTY_CONFIG[difficulty].label}
              </span>
            </div>
          )}
        </div>

        {/* Game Settings */}
        {difficulty && (
          <div className="max-w-md mx-auto">
            <Card>
              <CardBody className="p-6">
                <div className="flex items-center space-x-4">
                  <PuzzlePieceIcon className="w-6 h-6 text-purple-500" />
                  <div className="flex-1 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {DIFFICULTY_CONFIG[difficulty].description}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      color="secondary"
                      variant="flat"
                      onPress={handleChangeDifficulty}
                      size="sm"
                    >
                      難易度変更
                    </Button>
                    <Button
                      color="primary"
                      variant="flat"
                      onPress={handleNewGame}
                      size="sm"
                    >
                      新しいゲーム
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Game Stats */}
        {gameStats && (
          <div className="max-w-2xl mx-auto">
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
              <CardBody className="p-8 text-center">
                <div className="mb-6">
                  <TrophyIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-green-800 dark:text-green-200 mb-2">
                    🎉 ゲームクリア！
                  </h3>
                  <p className="text-green-600 dark:text-green-400">
                    素晴らしいプレイでした！
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {gameStats.moves}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">手数</div>
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {formatTime(gameStats.time)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">時間</div>
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {gameStats.score.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">スコア</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    color="primary"
                    size="lg"
                    onPress={handleNewGame}
                    className="font-semibold"
                  >
                    🎮 もう一度プレイ
                  </Button>
                  <Button
                    color="secondary"
                    variant="flat"
                    size="lg"
                    onPress={handleChangeDifficulty}
                    className="font-semibold"
                  >
                    🎯 難易度変更
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Error State */}
        {error && (
          <ErrorMessage
            message="ゲーム用画像の読み込みに失敗しました"
            onRetry={handleNewGame}
          />
        )}

        {/* Loading State */}
        {isLoading && (
          <Loading label="ゲーム用画像を準備中..." />
        )}

        {/* Game */}
        {data && data.thumbnails.length > 0 && difficulty && (
          <div className="max-w-4xl mx-auto">
            <MemoryGame
              thumbnails={data.thumbnails}
              onGameComplete={handleGameComplete}
              difficulty={difficulty}
              gameStats={gameStats}
            />
          </div>
        )}

        {/* Instructions */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <PuzzlePieceIcon className="w-5 h-5 text-purple-500" />
                <span>遊び方</span>
              </h3>
              <div className="space-y-2 text-gray-600 dark:text-gray-400">
                <p>• カードをクリックして裏返します</p>
                <p>• 同じ画像のペアを見つけてください</p>
                <p>• すべてのペアを見つけるとゲームクリアです</p>
                <p>• より少ない手数でクリアを目指しましょう！</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
