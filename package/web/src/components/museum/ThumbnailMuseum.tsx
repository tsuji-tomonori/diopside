'use client'

import { useEffect, useRef, useState } from 'react'
import type { Video } from '@/types/api'

interface ThumbnailState {
  x: number
  y: number
  scale: number
}

interface ThumbnailMuseumProps {
  videos: Video[]
}

export function ThumbnailMuseum({ videos }: ThumbnailMuseumProps) {
  const [states, setStates] = useState<Record<string, ThumbnailState>>({})
  const dragging = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null)

  useEffect(() => {
    const initial: Record<string, ThumbnailState> = {}
    videos.forEach((v) => {
      initial[v.video_id] = {
        x: Math.random() * 300,
        y: Math.random() * 300,
        scale: 1,
      }
    })
    setStates(initial)
  }, [videos])

  const handleMouseDown = (id: string, e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    dragging.current = { id, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!dragging.current) return
    const { id, offsetX, offsetY } = dragging.current
    setStates((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        x: e.clientX - offsetX,
        y: e.clientY - offsetY,
      },
    }))
  }

  const handleMouseUp = () => {
    dragging.current = null
  }

  const handleDoubleClick = (id: string) => {
    setStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], scale: prev[id].scale === 1 ? 1.5 : 1 },
    }))
  }

  return (
    <div className="relative w-full h-[80vh] bg-gray-100 overflow-hidden rounded-lg" data-testid="museum-canvas">
      {videos.map((v) => {
        const s = states[v.video_id]
        if (!s) return null
        return (
          <img
            key={v.video_id}
            src={v.thumbnail_url || ''}
            alt={v.title}
            data-testid="museum-thumbnail"
            onMouseDown={(e) => handleMouseDown(v.video_id, e)}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDoubleClick={() => handleDoubleClick(v.video_id)}
            className="w-40 h-auto absolute cursor-move transition-transform duration-200 ease-out"
            style={{ transform: `translate(${s.x}px, ${s.y}px) scale(${s.scale})` }}
          />
        )
      })}
    </div>
  )
}
