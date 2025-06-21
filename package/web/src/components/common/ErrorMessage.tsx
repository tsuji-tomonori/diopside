'use client'

import { Card, CardBody, Button } from '@heroui/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorMessage({
  title = 'エラーが発生しました',
  message,
  onRetry,
  className
}: ErrorMessageProps) {
  return (
    <Card className={`max-w-md mx-auto ${className || ''}`}>
      <CardBody className="text-center p-6">
        <ExclamationTriangleIcon className="w-12 h-12 text-danger mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {message}
        </p>
        {onRetry && (
          <Button
            color="primary"
            variant="flat"
            onPress={onRetry}
          >
            再試行
          </Button>
        )}
      </CardBody>
    </Card>
  )
}
