/**
 * generateStaticParams関数のテスト
 *
 * 動的ルートの静的生成に関するテストを実行
 */

import { generateStaticParams } from '../page'

describe('generateStaticParams', () => {
  it('should return array with placeholder for static export', async () => {
    const result = await generateStaticParams()

    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ id: 'placeholder' })
  })

  it('should return consistent results across multiple calls', async () => {
    const result1 = await generateStaticParams()
    const result2 = await generateStaticParams()

    expect(result1).toEqual(result2)
  })

  it('should return objects with correct structure', async () => {
    const result = await generateStaticParams()

    result.forEach(param => {
      expect(param).toHaveProperty('id')
      expect(typeof param.id).toBe('string')
    })
  })

  it('should handle static export requirements', async () => {
    // 静的エクスポート時に必要な最小限の設定をテスト
    const result = await generateStaticParams()

    // 空配列ではなく、少なくとも1つの要素を持つべき
    expect(result.length).toBeGreaterThan(0)

    // 各要素はid プロパティを持つべき
    result.forEach(param => {
      expect(param).toMatchObject({
        id: expect.any(String)
      })
    })
  })

  it('should not throw errors during execution', async () => {
    await expect(generateStaticParams()).resolves.not.toThrow()
  })

  it('should return valid URL-safe IDs', async () => {
    const result = await generateStaticParams()

    result.forEach(param => {
      // URL-safe文字列であることを確認
      expect(param.id).toMatch(/^[a-zA-Z0-9._~-]+$/)

      // 空文字列ではないことを確認
      expect(param.id.length).toBeGreaterThan(0)
    })
  })

  describe('fallback behavior for static export', () => {
    it('should work with CloudFront function routing', () => {
      // CloudFront関数が /video/[any-id] を /index.html にリダイレクトする設定で
      // generateStaticParams は最小限の設定を返す
      const result = generateStaticParams()

      expect(result).resolves.toEqual([{ id: 'placeholder' }])
    })

    it('should not depend on external API calls', async () => {
      // API呼び出しなしでも動作することを確認
      // （ビルド時にAPIが利用できない場合を想定）
      const originalFetch = global.fetch
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      try {
        const result = await generateStaticParams()
        expect(result).toEqual([{ id: 'placeholder' }])
      } finally {
        global.fetch = originalFetch
      }
    })

    it('should be suitable for client-side routing', async () => {
      const result = await generateStaticParams()

      // クライアントサイドルーティングで実際の動画IDが処理されることを想定
      // プレースホルダーが返されることを確認
      expect(result).toEqual([{ id: 'placeholder' }])
    })
  })

  describe('integration with Next.js static export', () => {
    it('should satisfy Next.js static export requirements', async () => {
      const result = await generateStaticParams()

      // Next.js の静的エクスポートが要求する形式に準拠
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String)
          })
        ])
      )
    })

    it('should be compatible with trailingSlash configuration', async () => {
      const result = await generateStaticParams()

      // trailingSlash: true 設定と互換性があること
      result.forEach(param => {
        // IDにトレイリングスラッシュが含まれていないこと
        expect(param.id).not.toMatch(/\/$/)
      })
    })

    it('should work with output: export configuration', async () => {
      const result = await generateStaticParams()

      // output: 'export' 設定で正常に動作すること
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })
  })
})
