'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Button } from '@heroui/react'

export default function VideoNotFound() {
  const router = useRouter()

  const handleBackClick = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-4">
        <div className="flex justify-center mb-4">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          動画が見つかりません
        </h1>

        <p className="text-gray-600 mb-8">
          指定された動画は存在しないか、削除された可能性があります。
        </p>

        <div className="space-y-4">
          <Button
            onPress={handleBackClick}
            color="primary"
            startContent={<ArrowLeftIcon className="w-5 h-5" />}
            size="lg"
          >
            戻る
          </Button>

          <div>
            <Button
              onPress={() => router.push('/')}
              variant="light"
              color="primary"
            >
              トップページに戻る
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
