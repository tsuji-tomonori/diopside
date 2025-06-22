import { test, expect } from '@playwright/test'

test.describe('Video Detail Page', () => {
  // Mock API response for consistent testing
  const mockVideo = {
    video_id: 'test-video-123',
    title: 'テスト動画のタイトル',
    tags: ['ゲーム実況', 'ホラー', 'Cry of Fear'],
    year: 2023,
    thumbnail_url: 'https://example.com/thumbnail.jpg',
    created_at: '2023-06-15T12:00:00Z',
  }

  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/videos/test-video-123', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockVideo),
      })
    })

    // Mock config endpoint
    await page.route('**/config', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          NEXT_PUBLIC_API_URL: 'https://api.example.com',
        }),
      })
    })
  })

  test('should display video details correctly', async ({ page }) => {
    await page.goto('/video/test-video-123')

    // Wait for content to load
    await expect(page.getByText('テスト動画のタイトル')).toBeVisible()

    // Check video title
    await expect(page.getByRole('heading', { name: 'テスト動画のタイトル' })).toBeVisible()

    // Check year
    await expect(page.getByText('2023年')).toBeVisible()

    // Check date
    await expect(page.getByText('2023年6月15日')).toBeVisible()

    // Check tags
    await expect(page.getByText('ゲーム実況')).toBeVisible()
    await expect(page.getByText('ホラー')).toBeVisible()
    await expect(page.getByText('Cry of Fear')).toBeVisible()

    // Check YouTube button
    await expect(page.getByRole('button', { name: /YouTubeで視聴/ })).toBeVisible()

    // Check thumbnail
    await expect(page.getByAltText('テスト動画のタイトル')).toBeVisible()
  })

  test('should navigate back when back button is clicked', async ({ page }) => {
    // Start from homepage
    await page.goto('/')

    // Navigate to video detail (mocking the navigation)
    await page.goto('/video/test-video-123')

    // Wait for content to load
    await expect(page.getByText('テスト動画のタイトル')).toBeVisible()

    // Click back button
    await page.getByRole('button', { name: '戻る' }).click()

    // Should navigate back
    await expect(page).toHaveURL('/')
  })

  test('should open YouTube video in new tab when YouTube button is clicked', async ({ page, context }) => {
    await page.goto('/video/test-video-123')

    // Wait for content to load
    await expect(page.getByText('テスト動画のタイトル')).toBeVisible()

    // Set up promise to wait for new tab
    const pagePromise = context.waitForEvent('page')

    // Click YouTube button
    await page.getByRole('button', { name: /YouTubeで視聴/ }).click()

    // Wait for new tab and check URL
    const newPage = await pagePromise
    await expect(newPage).toHaveURL('https://www.youtube.com/watch?v=test-video-123')
  })

  test('should open YouTube video when thumbnail is clicked', async ({ page, context }) => {
    await page.goto('/video/test-video-123')

    // Wait for content to load
    await expect(page.getByText('テスト動画のタイトル')).toBeVisible()

    // Set up promise to wait for new tab
    const pagePromise = context.waitForEvent('page')

    // Click thumbnail
    await page.getByAltText('テスト動画のタイトル').click()

    // Wait for new tab and check URL
    const newPage = await pagePromise
    await expect(newPage).toHaveURL('https://www.youtube.com/watch?v=test-video-123')
  })

  test('should navigate to tag search when tag is clicked', async ({ page }) => {
    await page.goto('/video/test-video-123')

    // Wait for content to load
    await expect(page.getByText('テスト動画のタイトル')).toBeVisible()

    // Click on a tag
    await page.getByText('ゲーム実況').click()

    // Should navigate to tags page with the selected tag
    await expect(page).toHaveURL('/tags?selected=' + encodeURIComponent('ゲーム実況'))
  })

  test('should display error page when video is not found', async ({ page }) => {
    // Mock 404 response
    await page.route('**/api/videos/nonexistent-video', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Video not found' }),
      })
    })

    await page.goto('/video/nonexistent-video')

    // Should show error message
    await expect(page.getByText('動画が見つかりません')).toBeVisible()
    await expect(page.getByText('指定された動画は存在しないか、削除された可能性があります。')).toBeVisible()

    // Should have back button and home link
    await expect(page.getByRole('button', { name: '戻る' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'トップページに戻る' })).toBeVisible()
  })

  test('should show loading state initially', async ({ page }) => {
    // Delay API response to test loading state
    await page.route('**/api/videos/test-video-123', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockVideo),
      })
    })

    await page.goto('/video/test-video-123')

    // Should show loading skeleton
    await expect(page.locator('.animate-pulse')).toBeVisible()

    // Wait for content to load
    await expect(page.getByText('テスト動画のタイトル')).toBeVisible()
  })

  test('should handle video without thumbnail', async ({ page }) => {
    const videoWithoutThumbnail = {
      ...mockVideo,
      thumbnail_url: undefined,
    }

    await page.route('**/api/videos/test-video-123', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(videoWithoutThumbnail),
      })
    })

    await page.goto('/video/test-video-123')

    // Should show placeholder text
    await expect(page.getByText('サムネイルなし')).toBeVisible()
  })

  test('should be accessible', async ({ page }) => {
    await page.goto('/video/test-video-123')

    // Wait for content to load
    await expect(page.getByText('テスト動画のタイトル')).toBeVisible()

    // Check for proper heading structure
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Check for alt text on images
    const thumbnail = page.getByAltText('テスト動画のタイトル')
    await expect(thumbnail).toBeVisible()

    // Check for keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: '戻る' })).toBeFocused()
  })

  test('should work on mobile devices', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is only for mobile devices')

    await page.goto('/video/test-video-123')

    // Wait for content to load
    await expect(page.getByText('テスト動画のタイトル')).toBeVisible()

    // Check responsive layout
    const container = page.locator('.max-w-4xl')
    await expect(container).toBeVisible()

    // Check that content is properly displayed on mobile
    await expect(page.getByRole('button', { name: /YouTubeで視聴/ })).toBeVisible()
  })
})

test.describe('Video Detail Navigation from Other Pages', () => {
  const mockVideos = [
    {
      video_id: 'video-1',
      title: '動画1',
      tags: ['タグ1'],
      year: 2023,
      thumbnail_url: 'https://example.com/thumb1.jpg',
    },
    {
      video_id: 'video-2',
      title: '動画2',
      tags: ['タグ2'],
      year: 2023,
      thumbnail_url: 'https://example.com/thumb2.jpg',
    },
  ]

  test.beforeEach(async ({ page }) => {
    // Mock API responses for video lists
    await page.route('**/api/videos**', async route => {
      const url = route.request().url()
      if (url.includes('video-1')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockVideos[0]),
        })
      } else if (url.includes('video-2')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockVideos[1]),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: mockVideos,
            last_key: null,
          }),
        })
      }
    })

    // Mock config endpoint
    await page.route('**/config', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          NEXT_PUBLIC_API_URL: 'https://api.example.com',
        }),
      })
    })
  })

  test('should navigate to video detail from homepage', async ({ page }) => {
    await page.goto('/')

    // Wait for videos to load and click on first video
    await expect(page.getByText('動画1')).toBeVisible()
    await page.getByText('動画1').click()

    // Should navigate to video detail page
    await expect(page).toHaveURL('/video/video-1')
    await expect(page.getByRole('heading', { name: '動画1' })).toBeVisible()
  })

  test('should navigate to video detail from random page', async ({ page }) => {
    // Mock random videos API
    await page.route('**/api/videos/random**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [mockVideos[0]],
        }),
      })
    })

    await page.goto('/random')

    // Trigger random video fetch
    await page.getByRole('button', { name: /シャッフル/ }).click()

    // Wait for video to appear and click it
    await expect(page.getByText('動画1')).toBeVisible()
    await page.getByText('動画1').click()

    // Should navigate to video detail page
    await expect(page).toHaveURL('/video/video-1')
  })

  test('should navigate to video detail from tags page', async ({ page }) => {
    // Mock tag tree and videos by tag
    await page.route('**/api/tags', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tree: [
            { name: 'タグ1', count: 1 },
            { name: 'タグ2', count: 1 },
          ],
        }),
      })
    })

    await page.route('**/api/videos/by-tag**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [mockVideos[0]],
        }),
      })
    })

    await page.goto('/tags')

    // Select a tag and click on resulting video
    await page.getByText('タグ1').click()
    await expect(page.getByText('動画1')).toBeVisible()
    await page.getByText('動画1').click()

    // Should navigate to video detail page
    await expect(page).toHaveURL('/video/video-1')
  })
})
