'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardBody, Button, Chip } from '@heroui/react'
import Image from 'next/image'
import { ArrowPathIcon, ClockIcon, HeartIcon, StarIcon, FireIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

interface MemoryCard {
  id: string
  imageUrl: string
  isFlipped: boolean
  isMatched: boolean
}

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

interface MemoryGameProps {
  thumbnails: string[]
  onGameComplete?: (moves: number, time: number) => void
  difficulty: DifficultyLevel
  gameStats?: { moves: number; time: number; score: number } | null
  className?: string
}

interface ReactionMessage {
  id: string
  message: string
  type: 'move' | 'match' | 'miss'
  timestamp: number
}

const REACTIONS = {
  move: [
    'いい選択ですね！',
    'どんなカードかな？',
    '集中していきましょう！',
    'いい感じですね✨',
    'この調子でいきましょう！'
  ],
  match: [
    'やったね！ペアできたよ！🎉',
    '素晴らしい！お見事です✨',
    'グッジョブ！パーフェクトですね！',
    'すごい！記憶力抜群ですね💪',
    'その調子！頑張って！🔥',
    'パーフェクトマッチ！素晴らしい！'
  ],
  miss: [
    '惜しい！次はきっとできるよ！',
    '大丈夫！気を取り直していこう！',
    '難しいけど請めないで！',
    '次こそ！集中していこう！',
    'まだまだチャンスはあるよ！'
  ]
}

export function MemoryGame({ thumbnails, onGameComplete, difficulty, gameStats, className }: MemoryGameProps) {
  const router = useRouter()
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [flippedCards, setFlippedCards] = useState<string[]>([])
  const [moves, setMoves] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [finalTime, setFinalTime] = useState<number | null>(null)
  const [gameComplete, setGameComplete] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [reactions, setReactions] = useState<ReactionMessage[]>([])
  const [showThumbnails, setShowThumbnails] = useState(false)

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (startTime && !gameComplete) {
      interval = setInterval(() => {
        const newTime = Math.floor((Date.now() - startTime) / 1000)
        setCurrentTime(newTime)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [startTime, gameComplete])

  // Add reaction message
  const addReaction = useCallback((type: 'move' | 'match' | 'miss') => {
    const messages = REACTIONS[type]
    const message = messages[Math.floor(Math.random() * messages.length)]
    const reaction: ReactionMessage = {
      id: `reaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      type,
      timestamp: Date.now()
    }

    setReactions(prev => [...prev, reaction])

    // Remove reaction after 3 seconds
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== reaction.id))
    }, 3000)
  }, [])

  // Initialize game
  const initializeGame = useCallback(() => {
    // Create pairs of cards for memory game
    const gameCards: MemoryCard[] = []

    // Each thumbnail should appear twice (as a pair)
    thumbnails.forEach((url, index) => {
      // First card of the pair
      gameCards.push({
        id: `card-${index}-a`,
        imageUrl: url,
        isFlipped: false,
        isMatched: false,
      })
      // Second card of the pair
      gameCards.push({
        id: `card-${index}-b`,
        imageUrl: url,
        isFlipped: false,
        isMatched: false,
      })
    })

    // Shuffle cards
    for (let i = gameCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
        ;[gameCards[i], gameCards[j]] = [gameCards[j], gameCards[i]]
    }

    console.log('Game initialized with', gameCards.length, 'cards from', thumbnails.length, 'thumbnails')
    console.log('Sample card:', gameCards[0])

    setCards(gameCards)
    setFlippedCards([])
    setMoves(0)
    setStartTime(null)
    setCurrentTime(0)
    setFinalTime(null)
    setGameComplete(false)
    setIsProcessing(false)
    setReactions([])
    setShowThumbnails(false)
  }, [thumbnails])

  // Initialize game when thumbnails change
  useEffect(() => {
    if (thumbnails.length > 0) {
      initializeGame()
    }
  }, [thumbnails, initializeGame])

  // Handle card click
  const handleCardClick = useCallback((cardId: string) => {
    if (isProcessing || gameComplete) return

    const card = cards.find(c => c.id === cardId)
    if (!card || card.isFlipped || card.isMatched) return

    console.log('Card clicked:', cardId, 'imageUrl:', card.imageUrl)

    // Start timer on first move
    if (startTime === null) {
      setStartTime(Date.now())
    }

    // Add move reaction
    addReaction('move')

    // Flip the card
    setCards(prev => prev.map(c =>
      c.id === cardId ? { ...c, isFlipped: true } : c
    ))

    const newFlippedCards = [...flippedCards, cardId]
    setFlippedCards(newFlippedCards)

    // Check for match when two cards are flipped
    if (newFlippedCards.length === 2) {
      setIsProcessing(true)
      setMoves(prev => prev + 1)

      const [firstCardId, secondCardId] = newFlippedCards
      const firstCard = cards.find(c => c.id === firstCardId)
      const secondCard = cards.find(c => c.id === secondCardId)

      setTimeout(() => {
        if (firstCard && secondCard && firstCard.imageUrl === secondCard.imageUrl) {
          // Match found
          addReaction('match')
          setCards(prev => prev.map(c =>
            c.id === firstCardId || c.id === secondCardId
              ? { ...c, isMatched: true }
              : c
          ))
        } else {
          // No match - flip cards back
          addReaction('miss')
          setCards(prev => prev.map(c =>
            c.id === firstCardId || c.id === secondCardId
              ? { ...c, isFlipped: false }
              : c
          ))
        }

        setFlippedCards([])
        setIsProcessing(false)
      }, 1000)
    }
  }, [cards, flippedCards, isProcessing, gameComplete, startTime, addReaction])

  // Check for game completion
  useEffect(() => {
    if (cards.length > 0 && cards.every(card => card.isMatched) && !gameComplete) {
      const endTime = Date.now()
      const totalTime = startTime ? Math.floor((endTime - startTime) / 1000) : currentTime

      setGameComplete(true)
      setShowThumbnails(true)
      setFinalTime(totalTime)

      if (onGameComplete) {
        onGameComplete(moves, totalTime)
      }
    }
  }, [cards, moves, startTime, currentTime, gameComplete, onGameComplete])

  // Format time display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Handle thumbnail click
  const handleThumbnailClick = (thumbnailUrl: string) => {
    try {
      // Extract video ID from thumbnail URL
      // Expected URL format: .../thumbnails/{video_id}.webp or similar
      const urlParts = thumbnailUrl.split('/')
      const filename = urlParts[urlParts.length - 1]
      const videoId = filename.split('.')[0]

      if (videoId && videoId.trim()) {
        console.log('Navigating to video:', videoId)
        router.push(`/?video_id=${encodeURIComponent(videoId)}`)
      } else {
        console.error('Could not extract video ID from URL:', thumbnailUrl)
      }
    } catch (error) {
      console.error('Error handling thumbnail click:', error, thumbnailUrl)
    }
  }

  // Get grid layout based on difficulty
  const getGridCols = () => {
    switch (difficulty) {
      case 'beginner': return 'grid-cols-4' // 6 pairs = 12 cards, 4x3 grid
      case 'intermediate': return 'grid-cols-4' // 8 pairs = 16 cards, 4x4 grid
      case 'advanced': return 'grid-cols-6' // 12 pairs = 24 cards, 6x4 grid
      default: return 'grid-cols-4'
    }
  }

  if (thumbnails.length === 0) {
    return (
      <Card className={className}>
        <CardBody className="text-center p-8">
          <p className="text-gray-500 dark:text-gray-400">
            ゲーム用の画像を読み込み中...
          </p>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardBody className="p-6">
        {/* Game Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <span>🧠 神経衰弱ゲーム</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              <Chip
                startContent={<ClockIcon className="w-4 h-4" />}
                color="primary"
                variant="flat"
                size="sm"
              >
                {startTime ? formatTime(currentTime) : '0:00'}
              </Chip>
              <Chip
                startContent={<StarIcon className="w-4 h-4" />}
                color="secondary"
                variant="flat"
                size="sm"
              >
                手数: {moves}
              </Chip>
            </div>
          </div>

          <Button
            color="warning"
            variant="flat"
            startContent={<ArrowPathIcon className="w-4 h-4" />}
            onPress={initializeGame}
            size="sm"
            className="self-end sm:self-auto"
          >
            リセット
          </Button>
        </div>

        {/* Reaction Messages */}
        <div className="fixed top-16 left-0 right-0 z-50 pointer-events-none">
          <div className="flex flex-col items-center space-y-2">
            {reactions.map((reaction, index) => (
              <div
                key={reaction.id}
                className={`animate-bounce`}
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animationDuration: '1.5s'
                }}
              >
                <Chip
                  className={`font-semibold shadow-2xl text-sm ${reaction.type === 'match' ? 'bg-green-500 text-white border-2 border-green-300' :
                      reaction.type === 'miss' ? 'bg-orange-500 text-white border-2 border-orange-300' :
                        'bg-blue-500 text-white border-2 border-blue-300'
                    }`}
                  startContent={
                    reaction.type === 'match' ? <HeartIcon className="w-4 h-4" /> :
                      reaction.type === 'miss' ? <FireIcon className="w-4 h-4" /> :
                        <StarIcon className="w-4 h-4" />
                  }
                >
                  {reaction.message}
                </Chip>
              </div>
            ))}
          </div>
        </div>

        {/* Game Complete Message */}
        {gameComplete && (
          <div className="bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
            <div className="text-center">
              <div className="text-4xl mb-2">🎆</div>
              <h4 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
                ゲームクリア！
              </h4>
              <p className="text-green-600 dark:text-green-400">
                {moves}手 {formatTime(finalTime || currentTime)}でクリアしました！
              </p>
            </div>
          </div>
        )}

        {/* Game Board */}
        <div className={`grid ${getGridCols()} gap-2 sm:gap-3 mb-6 mt-4`}>
          {cards.map((card) => (
            <Card
              key={card.id}
              className={`aspect-square cursor-pointer transition-all duration-500 transform ${card.isFlipped || card.isMatched
                  ? 'scale-105 rotate-0'
                  : 'hover:scale-102 hover:-rotate-1'
                } ${card.isMatched ? 'ring-2 ring-green-400 shadow-lg' : ''
                }`}
              isPressable={!card.isFlipped && !card.isMatched && !isProcessing}
              onPress={() => handleCardClick(card.id)}
            >
              <CardBody className="p-0 overflow-hidden">
                {card.isFlipped || card.isMatched ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={card.imageUrl}
                      alt="Memory card"
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 25vw, (max-width: 1024px) 20vw, 16vw"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent"></div>
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <span className="text-white text-xl font-bold drop-shadow-lg">?</span>
                    </div>
                    <div className="absolute bottom-2 right-2 w-4 h-4 bg-white/10 rounded-full"></div>
                    <div className="absolute top-2 left-2 w-2 h-2 bg-white/20 rounded-full"></div>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Thumbnail Gallery */}
        {showThumbnails && gameStats && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold flex items-center space-x-2">
                <span>🖼️</span>
                <span>ギャラリー - 使用されたサムネイル</span>
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                💆 タップで動画詳細へ
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* Remove duplicates from thumbnails */}
              {Array.from(new Set(thumbnails)).map((thumbnail, index) => {
                const videoId = thumbnail.split('/').pop()?.split('.')[0] || `thumbnail-${index}`
                return (
                  <Card
                    key={videoId}
                    className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-purple-300"
                    isPressable
                    onPress={() => handleThumbnailClick(thumbnail)}
                  >
                    <CardBody className="p-0 overflow-hidden relative group">
                      <div className="relative w-full aspect-video">
                        <Image
                          src={thumbnail}
                          alt={`動画サムネイル ${index + 1}`}
                          fill
                          className="object-cover transition-transform group-hover:scale-110"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                            <span className="text-lg">▶️</span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                )
              })}
            </div>
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                総数: {Array.from(new Set(thumbnails)).length}件のユニークなサムネイル
              </p>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
