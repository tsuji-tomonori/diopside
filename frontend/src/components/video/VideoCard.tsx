'use client'

import { Card, CardBody, CardFooter, Image, Chip } from '@heroui/react'
import { CalendarIcon, TagIcon } from '@heroicons/react/24/outline'
import type { Video } from '@/types/api'

interface VideoCardProps {
  video: Video
  onClick?: (video: Video) => void
  className?: string
}

export function VideoCard({ video, onClick, className }: VideoCardProps) {
  const handleClick = () => {
    onClick?.(video)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    try {
      const date = new Date(dateString)
      // Check if date is valid
      if (isNaN(date.getTime())) return null
      return date.toLocaleDateString('ja-JP')
    } catch {
      return null
    }
  }

  return (
    <Card 
      className={`w-full max-w-sm cursor-pointer hover:scale-105 transition-transform ${className || ''}`}
      isPressable
      onPress={handleClick}
    >
      <CardBody className="p-0">
        {video.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-48 object-cover"
            radius="none"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
            <span className="text-white text-lg font-semibold">
              {video.title.slice(0, 2)}
            </span>
          </div>
        )}
      </CardBody>
      
      <CardFooter className="flex flex-col items-start p-4 space-y-2">
        <h3 className="text-sm font-semibold line-clamp-2 text-left w-full">
          {video.title}
        </h3>
        
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <CalendarIcon className="w-4 h-4" />
          <span>{video.year}年</span>
          {formatDate(video.created_at) && (
            <>
              <span>•</span>
              <span>{formatDate(video.created_at)}</span>
            </>
          )}
        </div>
        
        {video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 w-full">
            <TagIcon className="w-4 h-4 text-gray-400 mt-0.5" />
            <div className="flex flex-wrap gap-1 flex-1">
              {video.tags.slice(0, 3).map((tag, index) => (
                <Chip
                  key={index}
                  size="sm"
                  variant="flat"
                  color="secondary"
                  className="text-xs"
                >
                  {tag}
                </Chip>
              ))}
              {video.tags.length > 3 && (
                <Chip
                  size="sm"
                  variant="flat"
                  color="default"
                  className="text-xs"
                >
                  +{video.tags.length - 3}
                </Chip>
              )}
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}