'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { TagTree } from '@/components/tag/TagTree'
import { VideoGrid } from '@/components/video/VideoGrid'
import { Loading } from '@/components/common/Loading'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { useTagTree, useVideosByTag } from '@/hooks/useApi'
import { Breadcrumbs, BreadcrumbItem, Card, CardBody } from '@heroui/react'
import { TagIcon } from '@heroicons/react/24/outline'
import type { Video } from '@/types/api'

export default function TagsPage() {
  const [selectedTagPath, setSelectedTagPath] = useState<string>('')
  
  const { data: tagData, error: tagError, isLoading: tagLoading } = useTagTree()
  const { data: videoData, error: videoError, isLoading: videoLoading } = useVideosByTag(selectedTagPath)

  const handleTagSelect = (tagPath: string) => {
    setSelectedTagPath(tagPath)
  }

  const handleVideoClick = (video: Video) => {
    // TODO: Implement video modal or navigation
    console.log('Video clicked:', video)
  }

  const getBreadcrumbs = () => {
    if (!selectedTagPath) return []
    return selectedTagPath.split('/')
  }

  const handleBreadcrumbClick = (index: number) => {
    const breadcrumbs = getBreadcrumbs()
    const newPath = breadcrumbs.slice(0, index + 1).join('/')
    setSelectedTagPath(newPath)
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-purple-800 dark:text-purple-200 mb-4">
            タグ検索
          </h1>
          <p className="text-lg text-purple-600 dark:text-purple-300 mb-8">
            階層構造のタグで動画を探索
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tag Tree */}
          <div className="lg:col-span-1">
            {tagError && (
              <ErrorMessage
                message="タグの読み込みに失敗しました"
                onRetry={() => window.location.reload()}
              />
            )}
            
            {tagLoading && <Loading label="タグを読み込み中..." />}
            
            {tagData && (
              <TagTree
                nodes={tagData.tree}
                onTagSelect={handleTagSelect}
              />
            )}
          </div>

          {/* Video Results */}
          <div className="lg:col-span-2">
            {selectedTagPath && (
              <div className="mb-6">
                <Card>
                  <CardBody className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <TagIcon className="w-5 h-5 text-purple-500" />
                      <span className="font-semibold">選択中のタグ:</span>
                    </div>
                    
                    <Breadcrumbs>
                      {getBreadcrumbs().map((tag, index) => (
                        <BreadcrumbItem
                          key={index}
                          onPress={() => handleBreadcrumbClick(index)}
                          className="cursor-pointer"
                        >
                          {tag}
                        </BreadcrumbItem>
                      ))}
                    </Breadcrumbs>
                  </CardBody>
                </Card>
              </div>
            )}

            {videoError && (
              <ErrorMessage
                message="動画の読み込みに失敗しました"
                onRetry={() => window.location.reload()}
              />
            )}

            {videoLoading && <Loading label="動画を読み込み中..." />}

            {videoData && (
              <VideoGrid
                videos={videoData.items}
                loading={videoLoading}
                onVideoClick={handleVideoClick}
              />
            )}

            {!selectedTagPath && !tagLoading && !tagError && (
              <Card>
                <CardBody className="text-center p-12">
                  <TagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    タグを選択してください
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500">
                    左側のタグツリーからタグを選択すると、関連する動画が表示されます
                  </p>
                </CardBody>
              </Card>
            )}

            {selectedTagPath && videoData && videoData.items.length === 0 && !videoLoading && (
              <Card>
                <CardBody className="text-center p-12">
                  <TagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    動画が見つかりませんでした
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500">
                    選択したタグに関連する動画がありません
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}