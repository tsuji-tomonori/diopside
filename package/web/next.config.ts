import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 1. 静的エクスポートを有効化
  output: 'export',

  // 2. 必要ならルートに index.html を置くために trailingSlash を付ける
  //    CloudFront＋S3 で配信するときにパス末尾のスラッシュを整える
  trailingSlash: true,

  // 3. ビルド成果物(.next)を別フォルダにしたい場合は distDir を設定
  //    ただし、静的エクスポート時は out/ が使われるので必須ではありません
  // distDir: 'build',

  // 4. 静的エクスポート時の画像最適化を無効化
  images: {
    unoptimized: true,
  },

  // 5. 静的エクスポート時のパス設定
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',

  // 6. 静的エクスポート時のリンク設定
  experimental: {
    // 静的エクスポート時のルーティング最適化
    optimizePackageImports: ['@heroui/react', '@heroicons/react'],
  },

  // その他、必要な Next.js のオプションをここに追記…
}

export default nextConfig
