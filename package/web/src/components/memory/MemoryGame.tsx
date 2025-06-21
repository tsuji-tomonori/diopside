'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardBody, Button, Image } from '@heroui/react'
import { ArrowPathIcon, PlayIcon } from '@heroicons/react/24/outline'

interface MemoryCard {
  id: string
  imageUrl: string
  isFlipped: boolean
  isMatched: boolean
}

interface MemoryGameProps {
  thumbnails: string[]
  onGameComplete?: (moves: number, time: number) => void
  className?: string
}

export function MemoryGame({ thumbnails, onGameComplete, className }: MemoryGameProps) {
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [flippedCards, setFlippedCards] = useState<string[]>([])
  const [moves, setMoves] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [gameComplete, setGameComplete] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Initialize game
  const initializeGame = useCallback(() => {
    const gameCards: MemoryCard[] = thumbnails.map((url, index) => ({
      id: `card-${index}`,
      imageUrl: url,
      isFlipped: false,
      isMatched: false,
    }))

    // Shuffle cards
    for (let i = gameCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[gameCards[i], gameCards[j]] = [gameCards[j], gameCards[i]]
    }

    setCards(gameCards)
    setFlippedCards([])
    setMoves(0)
    setStartTime(null)
    setGameComplete(false)
    setIsProcessing(false)
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

    // Start timer on first move
    if (startTime === null) {
      setStartTime(Date.now())
    }

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
          setCards(prev => prev.map(c =>
            c.id === firstCardId || c.id === secondCardId
              ? { ...c, isMatched: true }
              : c
          ))
        } else {
          // No match - flip cards back
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
  }, [cards, flippedCards, isProcessing, gameComplete, startTime])

  // Check for game completion
  useEffect(() => {
    if (cards.length > 0 && cards.every(card => card.isMatched)) {
      setGameComplete(true)
      if (startTime && onGameComplete) {
        const endTime = Date.now()
        const totalTime = Math.floor((endTime - startTime) / 1000)
        onGameComplete(moves, totalTime)
      }
    }
  }, [cards, moves, startTime, onGameComplete])

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
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold">神経衰弱ゲーム</h3>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              手数: {moves}
            </div>
          </div>

          <Button
            color="primary"
            variant="flat"
            startContent={<ArrowPathIcon className="w-4 h-4" />}
            onPress={initializeGame}
            size="sm"
          >
            リセット
          </Button>
        </div>

        {gameComplete && (
          <div className="bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <PlayIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-green-800 dark:text-green-200 font-semibold">
                ゲームクリア！ {moves}手でクリアしました！
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-3">
          {cards.map((card) => (
            <Card
              key={card.id}
              className={`aspect-square cursor-pointer transition-all duration-300 ${
                card.isFlipped || card.isMatched
                  ? 'scale-105'
                  : 'hover:scale-102'
              }`}
              isPressable={!card.isFlipped && !card.isMatched && !isProcessing}
              onPress={() => handleCardClick(card.id)}
            >
              <CardBody className="p-0 overflow-hidden">
                {card.isFlipped || card.isMatched ? (
                  <Image
                    src={card.imageUrl}
                    alt="Memory card"
                    className="w-full h-full object-cover"
                    radius="none"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg font-bold">?</span>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
