'use client'

import { Spinner } from '@heroui/react'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

export function Loading({ size = 'md', label = '読み込み中...', className }: LoadingProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className || ''}`}>
      <Spinner size={size} color="secondary" />
      {label && (
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          {label}
        </p>
      )}
    </div>
  )
}
