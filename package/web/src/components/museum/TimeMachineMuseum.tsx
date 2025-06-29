'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Video } from '@/types/api'

interface TimeMachineMuseumProps {
  videos: Video[]
}

interface ThumbnailData extends Video {
  angle: number
  radius: number
  layer: number
}

export function TimeMachineMuseum({ videos }: TimeMachineMuseumProps) {
  const [zoomLevel, setZoomLevel] = useState(0) // 0=外側, 1,2,3...=内側
  const [thumbnailsData, setThumbnailsData] = useState<ThumbnailData[]>([])
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [longPressTarget, setLongPressTarget] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const startTouchRef = useRef<{ x: number; y: number; distance: number } | null>(null)
  const initialPinchDistance = useRef<number>(0)

  // サムネイルデータの初期化
  useEffect(() => {
    const data: ThumbnailData[] = videos.map((video, index) => ({
      ...video,
      angle: (index * 137.5) % 360, // ゴールデンアングルで配置
      radius: Math.sqrt(index + 1) * 80 + 100, // 螺旋状に配置
      layer: Math.floor(index / 12), // 12個ごとに層を分ける
    }))
    setThumbnailsData(data)
  }, [videos])

  // ピンチジェスチャーの距離計算
  const getTouchDistance = (touches: React.TouchList) => {
    const touch1 = touches[0]
    const touch2 = touches[1]
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
  }

  // 長押し処理
  const handleLongPress = useCallback((videoId: string) => {
    const video = videos.find(v => v.video_id === videoId)
    if (video) {
      // 動画詳細ページへ遷移
      window.open(`https://www.youtube.com/watch?v=${video.video_id}`, '_blank')
    }
  }, [videos])

  // タッチ開始
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // ピンチジェスチャー開始
      const distance = getTouchDistance(e.touches)
      initialPinchDistance.current = distance
      startTouchRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        distance
      }
    } else if (e.touches.length === 1) {
      // 単一タッチ（長押し用）
      const touch = e.touches[0]
      const element = document.elementFromPoint(touch.clientX, touch.clientY)
      const videoId = element?.getAttribute('data-video-id')

      if (videoId) {
        const timer = setTimeout(() => {
          handleLongPress(videoId)
        }, 800) // 800ms長押し
        setLongPressTimer(timer)
        setLongPressTarget(videoId)
      }
    }
  }, [handleLongPress])

  // タッチ移動
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // 長押しタイマーをクリア（移動したら長押し無効）
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
      setLongPressTarget(null)
    }

    if (e.touches.length === 2 && startTouchRef.current) {
      e.preventDefault()
      const currentDistance = getTouchDistance(e.touches)
      const scale = currentDistance / initialPinchDistance.current

      // スケールに基づいてズームレベルを調整
      const deltaZoom = (scale - 1) * 2
      const newZoomLevel = Math.max(0, Math.min(5, zoomLevel + deltaZoom))
      setZoomLevel(newZoomLevel)
    }
  }, [zoomLevel, longPressTimer])

  // タッチ終了
  const handleTouchEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
      setLongPressTarget(null)
    }
    startTouchRef.current = null
    initialPinchDistance.current = 0
  }, [longPressTimer])

  // マウスホイールでのズーム
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.2 : -0.2
    setZoomLevel(prev => Math.max(0, Math.min(5, prev + delta)))
  }, [])


  // サムネイルの位置計算
  const getThumbnailStyle = (thumbnail: ThumbnailData) => {
    const effectiveRadius = thumbnail.radius - (zoomLevel * 50)
    const angleRad = (thumbnail.angle * Math.PI) / 180
    const layerOffset = (thumbnail.layer - zoomLevel) * 100

    const x = Math.cos(angleRad) * effectiveRadius
    const y = Math.sin(angleRad) * effectiveRadius + layerOffset
    const z = -thumbnail.layer * 50 + (zoomLevel * 100)

    // 可視性チェック
    const isVisible = thumbnail.layer <= zoomLevel + 2 && thumbnail.layer >= zoomLevel - 1
    const opacity = isVisible ? Math.max(0.3, 1 - Math.abs(thumbnail.layer - zoomLevel) * 0.3) : 0

    return {
      x,
      y,
      z,
      opacity,
      scale: Math.max(0.5, 1 - Math.abs(thumbnail.layer - zoomLevel) * 0.2)
    }
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* タイムマシン効果の背景 */}
      <div className="absolute inset-0 bg-gradient-radial from-blue-900/20 via-purple-900/10 to-black"></div>

      {/* 中央からの光線効果 */}
      <div
        className="absolute inset-0 bg-gradient-conic from-transparent via-blue-500/10 to-transparent"
        style={{
          transform: `rotate(${zoomLevel * 20}deg)`,
          opacity: zoomLevel * 0.3
        }}
      ></div>

      {/* メインコンテナ */}
      <motion.div
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center perspective-1000"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ perspective: '1000px' }}
      >
        <AnimatePresence>
          {thumbnailsData.map((thumbnail) => {
            const style = getThumbnailStyle(thumbnail)

            return (
              <motion.div
                key={thumbnail.video_id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  x: style.x,
                  y: style.y,
                  z: style.z,
                  opacity: style.opacity,
                  scale: style.scale,
                  rotateY: zoomLevel * 10
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 20,
                  duration: 0.8
                }}
                className="absolute transform-gpu"
                style={{
                  transformStyle: 'preserve-3d',
                }}
              >
                <motion.img
                  src={thumbnail.thumbnail_url || ''}
                  alt={thumbnail.title}
                  data-video-id={thumbnail.video_id}
                  className={`w-32 h-18 object-cover rounded-lg shadow-lg cursor-pointer transition-all duration-200 ${
                    longPressTarget === thumbnail.video_id ? 'ring-4 ring-blue-400' : ''
                  }`}
                  whileHover={{
                    scale: 1.1,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                  }}
                  whileTap={{ scale: 0.95 }}
                />

                {/* タイトル表示（ズームが深い時のみ） */}
                {zoomLevel > 2 && style.opacity > 0.7 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -bottom-8 left-0 right-0 text-white text-xs text-center bg-black/50 px-2 py-1 rounded truncate"
                  >
                    {thumbnail.title}
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>

      {/* UI コントロール */}
      <div className="absolute top-4 left-4 text-white">
        <div className="bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">
          <p className="text-sm">ズームレベル: {zoomLevel.toFixed(1)}</p>
          <p className="text-xs mt-1">
            📱 ピンチで拡大・縮小 / 💻 マウスホイールでズーム
          </p>
          <p className="text-xs">長押しで動画詳細を表示</p>
        </div>
      </div>

      {/* ズームインジケーター */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center space-x-2 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
          {[0, 1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`w-2 h-2 rounded-full transition-colors ${
                Math.floor(zoomLevel) === level ? 'bg-blue-400' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
