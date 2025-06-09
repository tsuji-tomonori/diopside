'use client'

import { Link } from '@heroui/react'
import { HeartIcon } from '@heroicons/react/24/solid'

export function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Made with</span>
            <HeartIcon className="w-4 h-4 text-red-500" />
            <span>for 白雪巴さん</span>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-500">
            <p>
              このサイトは白雪巴さんのファンサイトです。
              <br />
              動画の著作権は白雪巴さんに帰属します。
            </p>
          </div>
          
          <div className="flex justify-center space-x-6 text-xs">
            <Link 
              href="https://www.youtube.com/@shirayukitomoe" 
              isExternal
              className="text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
            >
              YouTube
            </Link>
            <Link 
              href="https://twitter.com/shirayuki_tomoe" 
              isExternal
              className="text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
            >
              Twitter
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}