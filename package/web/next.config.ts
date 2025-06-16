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

  // その他、必要な Next.js のオプションをここに追記…
}

export default nextConfig
