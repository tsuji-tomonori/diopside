'use client'

import { useState } from 'react'
import { Card, CardBody, Button, Chip } from '@heroui/react'
import { ChevronRightIcon, ChevronDownIcon, FolderIcon, DocumentIcon } from '@heroicons/react/24/outline'
import type { TagNode } from '@/types/api'

interface TagTreeProps {
  nodes: TagNode[]
  onTagSelect?: (tagPath: string) => void
  className?: string
}

interface TagNodeItemProps {
  node: TagNode
  path: string[]
  onTagSelect?: (tagPath: string) => void
  level: number
}

function TagNodeItem({ node, path, onTagSelect, level }: TagNodeItemProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0)
  const currentPath = [...path, node.name]
  const hasChildren = node.children && node.children.length > 0
  
  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded)
    }
  }

  const handleSelect = () => {
    const tagPath = currentPath.join('/')
    onTagSelect?.(tagPath)
  }

  const indentClass = `ml-${level * 4}`

  return (
    <div className="w-full">
      <div className={`flex items-center space-x-2 py-2 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg ${indentClass}`}>
        {hasChildren ? (
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={handleToggle}
            className="min-w-6 w-6 h-6"
          >
            {isExpanded ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
          </Button>
        ) : (
          <div className="w-6 h-6 flex items-center justify-center">
            <DocumentIcon className="w-4 h-4 text-gray-400" />
          </div>
        )}
        
        <div className="flex items-center space-x-2 flex-1">
          {hasChildren && (
            <FolderIcon className="w-4 h-4 text-purple-500" />
          )}
          
          <Button
            variant="light"
            size="sm"
            onPress={handleSelect}
            className="justify-start flex-1 h-auto p-1"
          >
            <span className="text-left truncate">{node.name}</span>
          </Button>
          
          {node.count !== undefined && (
            <Chip
              size="sm"
              variant="flat"
              color="secondary"
              className="text-xs"
            >
              {node.count}
            </Chip>
          )}
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="ml-2">
          {node.children!.map((child, index) => (
            <TagNodeItem
              key={`${child.name}-${index}`}
              node={child}
              path={currentPath}
              onTagSelect={onTagSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function TagTree({ nodes, onTagSelect, className }: TagTreeProps) {
  if (nodes.length === 0) {
    return (
      <Card className={className}>
        <CardBody>
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            タグが見つかりませんでした
          </p>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardBody className="p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <FolderIcon className="w-5 h-5 text-purple-500" />
          <span>タグ一覧</span>
        </h3>
        
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {nodes.map((node, index) => (
            <TagNodeItem
              key={`${node.name}-${index}`}
              node={node}
              path={[]}
              onTagSelect={onTagSelect}
              level={0}
            />
          ))}
        </div>
      </CardBody>
    </Card>
  )
}