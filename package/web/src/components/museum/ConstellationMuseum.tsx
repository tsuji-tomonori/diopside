'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Video } from '@/types/api'

interface ConstellationMuseumProps {
  videos: Video[]
}

interface StarData {
  id: string
  video: Video
  x: number
  y: number
  z: number
  size: number
  brightness: number
  connections: string[]
}

// 星座パターンの定義
const CONSTELLATION_PATTERNS: Record<string, { positions: [number, number][], connections: number[][] }> = {
  orion: {
    positions: [
      [-100, -150], [100, -150], // 肩
      [-50, -50], [50, -50], // 腰
      [-80, 50], [0, 50], [80, 50], // ベルト
      [-50, 150], [50, 150], // 足
    ],
    connections: [[0, 2], [1, 3], [2, 4], [3, 6], [4, 5], [5, 6], [4, 7], [6, 8]]
  },
  ursa_major: {
    positions: [
      [-150, -100], [-50, -120], [50, -100], [150, -50], // 柄杓の器
      [150, 50], [100, 100], [50, 120], // 柄
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [0, 3]]
  },
  cassiopeia: {
    positions: [
      [-150, 0], [-75, -50], [0, 0], [75, -50], [150, 0],
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4]]
  },
  cygnus: {
    positions: [
      [0, -150], // 頭
      [0, -50], // 首
      [-100, 0], [0, 0], [100, 0], // 翼
      [0, 100], // 尾
    ],
    connections: [[0, 1], [1, 3], [2, 3], [3, 4], [3, 5]]
  },
  scorpius: {
    positions: [
      [-100, -150], [-50, -100], [0, -50], [50, 0], // 頭
      [100, 50], [120, 100], [100, 150], // 胴体
      [50, 180], [0, 200], [-50, 180], // 尾
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9]]
  }
}

const CONSTELLATION_TYPES = Object.keys(CONSTELLATION_PATTERNS)

export function ConstellationMuseum({ videos }: ConstellationMuseumProps) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0 })
  const [stars, setStars] = useState<StarData[]>([])
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [longPressTarget, setLongPressTarget] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, camX: 0, camY: 0 })
  const pinchStart = useRef<{ distance: number; zoom: number } | null>(null)
  const generationQueue = useRef<Set<string>>(new Set())
  const lastGenerationTime = useRef(0)

  // 背景の星をメモ化
  const backgroundStars = useMemo(() =>
    Array.from({ length: 200 }).map((_, i) => ({
      id: `bg-star-${i}`,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2,
      opacity: Math.random() * 0.8,
    })), []
  )

  // 星座生成関数（メモ化）
  const generateConstellation = useCallback((centerX: number, centerY: number, videosList: Video[], startIndex: number) => {
    const newStars: StarData[] = []
    const type = CONSTELLATION_TYPES[Math.floor(Math.random() * CONSTELLATION_TYPES.length)]
    const pattern = CONSTELLATION_PATTERNS[type]
    const scale = 2 + Math.random() * 2
    const rotation = Math.random() * Math.PI * 2

    pattern.positions.forEach((pos, i) => {
      if (startIndex + i >= videosList.length) return

      const x = centerX + (pos[0] * Math.cos(rotation) - pos[1] * Math.sin(rotation)) * scale
      const y = centerY + (pos[0] * Math.sin(rotation) + pos[1] * Math.cos(rotation)) * scale

      const star: StarData = {
        id: `star-${centerX}-${centerY}-${i}`,
        video: videosList[(startIndex + i) % videosList.length],
        x,
        y,
        z: Math.random() * 100,
        size: 0.8 + Math.random() * 0.4,
        brightness: 0.7 + Math.random() * 0.3,
        connections: []
      }

      newStars.push(star)
    })

    // 接続を設定
    pattern.connections.forEach(([from, to]) => {
      if (from < newStars.length && to < newStars.length) {
        newStars[from].connections.push(newStars[to].id)
      }
    })

    return newStars
  }, [])

  // 初期星座の生成（1回のみ）
  useEffect(() => {
    const initialStars: StarData[] = []
    let videoIndex = 0

    for (let r = 0; r < 3000; r += 800) {
      const numConstellations = Math.max(1, Math.floor((2 * Math.PI * r) / 600))
      for (let i = 0; i < numConstellations; i++) {
        const angle = (i / numConstellations) * 2 * Math.PI
        const x = r * Math.cos(angle) + (Math.random() - 0.5) * 200
        const y = r * Math.sin(angle) + (Math.random() - 0.5) * 200

        const constellation = generateConstellation(x, y, videos, videoIndex)
        initialStars.push(...constellation)
        videoIndex = (videoIndex + constellation.length) % videos.length
      }
    }

    setStars(initialStars)
  }, [generateConstellation, videos]) // 必要な依存関係を追加

  // 可視範囲の計算（メモ化）
  const visibleRange = useMemo(() => {
    const buffer = 1000
    const viewWidth = window.innerWidth / zoomLevel
    const viewHeight = window.innerHeight / zoomLevel

    return {
      minX: cameraPosition.x - viewWidth / 2 - buffer,
      maxX: cameraPosition.x + viewWidth / 2 + buffer,
      minY: cameraPosition.y - viewHeight / 2 - buffer,
      maxY: cameraPosition.y + viewHeight / 2 + buffer
    }
  }, [cameraPosition.x, cameraPosition.y, zoomLevel])

  // 新しい星座を生成（デバウンス付き）
  useEffect(() => {
    const generateNewConstellations = () => {
      const now = Date.now()
      if (now - lastGenerationTime.current < 500) return // 500msのクールダウン

      const currentBounds = stars.reduce((bounds, star) => ({
        minX: Math.min(bounds.minX, star.x),
        maxX: Math.max(bounds.maxX, star.x),
        minY: Math.min(bounds.minY, star.y),
        maxY: Math.max(bounds.maxY, star.y)
      }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity })

      const areas = [
        { key: 'left', x: visibleRange.minX - 500, y: cameraPosition.y, check: visibleRange.minX < currentBounds.minX + 500 },
        { key: 'right', x: visibleRange.maxX + 500, y: cameraPosition.y, check: visibleRange.maxX > currentBounds.maxX - 500 },
        { key: 'top', x: cameraPosition.x, y: visibleRange.minY - 500, check: visibleRange.minY < currentBounds.minY + 500 },
        { key: 'bottom', x: cameraPosition.x, y: visibleRange.maxY + 500, check: visibleRange.maxY > currentBounds.maxY - 500 }
      ]

      const newStars: StarData[] = []
      areas.forEach(area => {
        if (area.check && !generationQueue.current.has(area.key)) {
          generationQueue.current.add(area.key)

          for (let i = 0; i < 3; i++) {
            const x = area.x + (Math.random() - 0.5) * 800
            const y = area.y + (Math.random() - 0.5) * 800
            const videoIndex = Math.floor(Math.random() * videos.length)
            const constellation = generateConstellation(x, y, videos, videoIndex)
            newStars.push(...constellation)
          }

          setTimeout(() => generationQueue.current.delete(area.key), 1000)
        }
      })

      if (newStars.length > 0) {
        lastGenerationTime.current = now
        setStars(prev => [...prev, ...newStars])
      }
    }

    const timer = setTimeout(generateNewConstellations, 200)
    return () => clearTimeout(timer)
  }, [visibleRange, cameraPosition, videos, generateConstellation, stars])

  // 可視範囲内の星をフィルタリング（メモ化）
  const visibleStars = useMemo(() =>
    stars.filter(star =>
      star.x >= visibleRange.minX &&
      star.x <= visibleRange.maxX &&
      star.y >= visibleRange.minY &&
      star.y <= visibleRange.maxY
    ), [stars, visibleRange]
  )

  // マウス操作（最適化）
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      camX: cameraPosition.x,
      camY: cameraPosition.y
    }
  }, [cameraPosition])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return

    const deltaX = (e.clientX - dragStart.current.x) / zoomLevel
    const deltaY = (e.clientY - dragStart.current.y) / zoomLevel

    setCameraPosition({
      x: dragStart.current.camX - deltaX,
      y: dragStart.current.camY - deltaY
    })
  }, [zoomLevel])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
  }, [])

  // ホイール操作（最適化）
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoomLevel(prev => Math.max(0.1, Math.min(10, prev * delta)))
  }, [])

  // タッチ操作
  const getTouchDistance = (touches: React.TouchList) => {
    const touch1 = touches[0]
    const touch2 = touches[1]
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
  }

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches)
      pinchStart.current = { distance, zoom: zoomLevel }
    } else if (e.touches.length === 1) {
      const touch = e.touches[0]
      isDragging.current = true
      dragStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        camX: cameraPosition.x,
        camY: cameraPosition.y
      }

      const element = document.elementFromPoint(touch.clientX, touch.clientY)
      const videoId = element?.getAttribute('data-video-id')

      if (videoId) {
        const timer = setTimeout(() => {
          const star = stars.find(s => s.video.video_id === videoId)
          if (star) {
            window.open(`https://www.youtube.com/watch?v=${star.video.video_id}`, '_blank')
          }
        }, 800)
        setLongPressTimer(timer)
        setLongPressTarget(videoId)
      }
    }
  }, [zoomLevel, cameraPosition, stars])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
      setLongPressTarget(null)
    }

    if (e.touches.length === 2 && pinchStart.current) {
      const currentDistance = getTouchDistance(e.touches)
      const scale = currentDistance / pinchStart.current.distance
      setZoomLevel(Math.max(0.1, Math.min(10, pinchStart.current.zoom * scale)))
    } else if (e.touches.length === 1 && isDragging.current) {
      const touch = e.touches[0]
      const deltaX = (touch.clientX - dragStart.current.x) / zoomLevel
      const deltaY = (touch.clientY - dragStart.current.y) / zoomLevel

      setCameraPosition({
        x: dragStart.current.camX - deltaX,
        y: dragStart.current.camY - deltaY
      })
    }
  }, [zoomLevel, longPressTimer])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
      setLongPressTarget(null)
    }
    isDragging.current = false
    pinchStart.current = null
  }, [longPressTimer])

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden cursor-move">
      {/* 背景の星空 */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-blue-950/20 to-purple-950/20"></div>
        {backgroundStars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>

      {/* メインキャンバス */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center',
          }}
        >
          {/* 星座の線 */}
          <svg
            className="absolute pointer-events-none"
            style={{
              width: '100%',
              height: '100%',
              left: `${-cameraPosition.x * zoomLevel + window.innerWidth / 2}px`,
              top: `${-cameraPosition.y * zoomLevel + window.innerHeight / 2}px`,
            }}
          >
            {visibleStars.map(star =>
              star.connections.map(targetId => {
                const target = visibleStars.find(s => s.id === targetId)
                if (!target) return null

                return (
                  <line
                    key={`${star.id}-${targetId}`}
                    x1={star.x * zoomLevel}
                    y1={star.y * zoomLevel}
                    x2={target.x * zoomLevel}
                    y2={target.y * zoomLevel}
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="1"
                  />
                )
              })
            )}
          </svg>

          {/* 星（サムネイル） */}
          <div
            className="absolute"
            style={{
              left: `${-cameraPosition.x * zoomLevel + window.innerWidth / 2}px`,
              top: `${-cameraPosition.y * zoomLevel + window.innerHeight / 2}px`,
            }}
          >
            <AnimatePresence mode="popLayout">
              {visibleStars.map(star => (
                <motion.div
                  key={star.id}
                  layoutId={star.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: star.brightness,
                    scale: star.size,
                  }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    duration: 0.3
                  }}
                  className="absolute"
                  style={{
                    left: `${star.x * zoomLevel}px`,
                    top: `${star.y * zoomLevel}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="relative group">
                    {/* 星の光彩 */}
                    <div
                      className="absolute inset-0 rounded-full blur-xl pointer-events-none"
                      style={{
                        background: `radial-gradient(circle, rgba(255,255,255,${star.brightness * 0.5}) 0%, transparent 70%)`,
                        transform: 'scale(2)',
                      }}
                    />

                    {/* サムネイル */}
                    <motion.img
                      src={star.video.thumbnail_url || ''}
                      alt={star.video.title}
                      data-video-id={star.video.video_id}
                      className={`relative w-24 h-14 object-cover rounded-lg shadow-2xl cursor-pointer ${
                        longPressTarget === star.video.video_id ? 'ring-4 ring-white' : ''
                      }`}
                      style={{
                        filter: `brightness(${star.brightness})`,
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      loading="lazy"
                    />

                    {/* ホバー時のタイトル */}
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none">
                      {star.video.title}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* UI コントロール */}
      <div className="absolute top-4 left-4 text-white pointer-events-none">
        <div className="bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">
          <p className="text-sm">ズーム: {zoomLevel.toFixed(1)}x</p>
          <p className="text-xs mt-1">
            📱 ピンチで拡大・縮小 / 💻 マウスホイール
          </p>
          <p className="text-xs">ドラッグで移動 / 長押しで動画詳細</p>
        </div>
      </div>

      {/* ミニマップ */}
      <div className="absolute bottom-4 right-4 w-48 h-32 bg-black/50 rounded-lg backdrop-blur-sm border border-white/20 pointer-events-none">
        <div className="relative w-full h-full overflow-hidden">
          {stars.filter((_, i) => i % 20 === 0).map(star => (
            <div
              key={star.id}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${((star.x + 5000) / 10000) * 100}%`,
                top: `${((star.y + 5000) / 10000) * 100}%`,
                opacity: 0.6
              }}
            />
          ))}
          <div
            className="absolute border border-yellow-400"
            style={{
              left: `${((cameraPosition.x + 5000 - window.innerWidth / zoomLevel / 2) / 10000) * 100}%`,
              top: `${((cameraPosition.y + 5000 - window.innerHeight / zoomLevel / 2) / 10000) * 100}%`,
              width: `${(window.innerWidth / zoomLevel / 10000) * 100}%`,
              height: `${(window.innerHeight / zoomLevel / 10000) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
