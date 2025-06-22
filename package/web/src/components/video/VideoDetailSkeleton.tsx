export default function VideoDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50" data-testid="video-detail-skeleton">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button Skeleton */}
        <div className="mb-6">
          <div className="w-20 h-10 bg-gray-200 rounded-md animate-pulse"></div>
        </div>

        {/* Video Hero Section Skeleton */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Thumbnail Skeleton */}
            <div className="md:w-1/2">
              <div className="w-full h-64 md:h-80 bg-gray-200 animate-pulse"></div>
            </div>

            {/* Video Info Skeleton */}
            <div className="md:w-1/2 p-6">
              {/* Title Skeleton */}
              <div className="mb-4">
                <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </div>

              {/* Metadata Skeleton */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center">
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse mr-2"></div>
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-4 bg-gray-200 rounded animate-pulse mr-2"></div>
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Tags Skeleton */}
              <div className="mb-6">
                <div className="w-12 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="flex flex-wrap gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-16 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                  ))}
                </div>
              </div>

              {/* YouTube Button Skeleton */}
              <div className="pt-4 border-t border-gray-200">
                <div className="w-32 h-12 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Section Skeleton */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <div className="w-24 h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div>
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
