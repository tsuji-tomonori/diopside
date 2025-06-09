'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { MemoryGame } from '@/components/memory/MemoryGame'
import { Loading } from '@/components/common/Loading'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { useMemoryThumbnails } from '@/hooks/useApi'
import { Card, CardBody, Button, Select, SelectItem } from '@heroui/react'
import { PuzzlePieceIcon, TrophyIcon } from '@heroicons/react/24/outline'

export default function MemoryPage() {
  const [pairs, setPairs] = useState(8)
  const [gameStats, setGameStats] = useState<{ moves: number; time: number } | null>(null)
  
  const { data, error, isLoading, mutate } = useMemoryThumbnails(pairs)

  const handlePairsChange = (keys: any) => {
    const newPairs = Array.from(keys)[0] as string
    if (newPairs) {
      setPairs(parseInt(newPairs, 10))
      setGameStats(null)
    }
  }

  const handleGameComplete = (moves: number, time: number) => {
    setGameStats({ moves, time })
  }

  const handleNewGame = () => {
    mutate()
    setGameStats(null)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-purple-800 dark:text-purple-200 mb-4">
            神経衰弱ゲーム
          </h1>
          <p className="text-lg text-purple-600 dark:text-purple-300 mb-8">
            白雪巴さんの動画サムネイルで神経衰弱を楽しもう
          </p>
        </div>

        {/* Game Settings */}
        <div className="max-w-md mx-auto">
          <Card>
            <CardBody className="p-6">
              <div className="flex items-center space-x-4">
                <PuzzlePieceIcon className="w-6 h-6 text-purple-500" />
                <div className="flex-1">
                  <Select
                    label="ペア数"
                    selectedKeys={[pairs.toString()]}
                    onSelectionChange={handlePairsChange}
                    className="max-w-xs"
                  >
                    <SelectItem key="4" value="4">4ペア (8枚)</SelectItem>
                    <SelectItem key="6" value="6">6ペア (12枚)</SelectItem>
                    <SelectItem key="8" value="8">8ペア (16枚)</SelectItem>
                    <SelectItem key="10" value="10">10ペア (20枚)</SelectItem>
                  </Select>
                </div>
                <Button
                  color="primary"
                  variant="flat"
                  onPress={handleNewGame}
                  size="sm"
                >
                  新しいゲーム
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Game Stats */}
        {gameStats && (
          <div className="max-w-md mx-auto">
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardBody className="p-6 text-center">
                <TrophyIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">
                  ゲームクリア！
                </h3>
                <div className="space-y-2 text-green-700 dark:text-green-300">
                  <p>手数: <span className="font-bold">{gameStats.moves}</span></p>
                  <p>時間: <span className="font-bold">{formatTime(gameStats.time)}</span></p>
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
        {data && data.thumbnails.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <MemoryGame
              thumbnails={data.thumbnails}
              onGameComplete={handleGameComplete}
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