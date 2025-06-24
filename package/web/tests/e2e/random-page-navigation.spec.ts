import { test, expect } from '@playwright/test'

test.describe('Random Page Navigation', () => {
  test.setTimeout(60000) // Set timeout to 60 seconds
  // Mock video data for consistent testing
  const mockVideo1 = {
    video_id: 'test-video-1',
    title: '【雑談】テスト動画1【白雪 巴/にじさんじ】',
    tags: ['雑談', '白雪 巴', 'にじさんじ'],
    year: 2023,
    thumbnail_url: 'https://img.youtube.com/vi/test-video-1/maxresdefault.jpg',
    created_at: '2023-06-15T12:00:00Z',
  }

  const mockVideo2 = {
    video_id: 'test-video-2',
    title: '【ゲーム実況】テスト動画2【白雪 巴/にじさんじ】',
    tags: ['ゲーム実況', '白雪 巴', 'にじさんじ'],
    year: 2023,
    thumbnail_url: 'https://img.youtube.com/vi/test-video-2/maxresdefault.jpg',
    created_at: '2023-06-15T13:00:00Z',
  }

  test.beforeEach(async ({ page }) => {
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

    // Mock random videos API - always return the same video for consistency
    await page.route('**/api/videos/random?count=1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [mockVideo1]
        }),
      })
    })

    // Mock video detail API
    await page.route(`**/api/videos/${mockVideo1.video_id}`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockVideo1),
      })
    })

    // Mock tag tree API
    await page.route('**/api/tags', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          root: {
            name: 'root',
            children: []
          }
        }),
      })
    })
  })

  test('should persist the same video when navigating back from video detail page', async ({ page }) => {
    // Step 1: Navigate to random page
    await page.goto('/random')

    // Step 2: Wait for the random video to load and take initial shuffle
    await page.getByRole('button', { name: 'シャッフル' }).first().click()
    await expect(page.getByText(mockVideo1.title)).toBeVisible({ timeout: 10000 })

    // Step 3: Store the video title that was displayed
    const initialVideoTitle = await page.getByText(mockVideo1.title).textContent()
    expect(initialVideoTitle).toBe(mockVideo1.title)

    // Step 4: Click on the video to navigate to detail page
    await page.getByText(mockVideo1.title).click()

    // Step 5: Wait for video detail page to load
    await expect(page).toHaveURL(new RegExp(`/video\\?id=${mockVideo1.video_id}`), { timeout: 10000 })

    // Step 6: Use browser back button to return to random page
    await page.goBack()

    // Step 7: Wait for random page to load again
    await expect(page).toHaveURL('/random', { timeout: 10000 })
    await expect(page.getByText('ランダム動画')).toBeVisible({ timeout: 10000 })

    // Step 8: Verify the same video is still displayed (not changed)
    await expect(page.getByText(mockVideo1.title)).toBeVisible({ timeout: 10000 })
    const restoredVideoTitle = await page.getByText(mockVideo1.title).textContent()
    expect(restoredVideoTitle).toBe(initialVideoTitle)

    // Step 9: Verify that sessionStorage contains the correct video
    const sessionStorageData = await page.evaluate(() => {
      const data = sessionStorage.getItem('randomPageState')
      return data ? JSON.parse(data) : null
    })

    expect(sessionStorageData).not.toBeNull()
    expect(sessionStorageData.currentVideo).toEqual(mockVideo1)
  })

  test.skip('should load new video only when shuffle button is clicked after navigation', async ({ page }) => {
    // Setup a different video for shuffle
    await page.route('**/api/videos/random?count=1', async route => {
      // For this test, we'll return different videos on subsequent calls
      const callCount = (route as any).callCount || 0;
      const videoToReturn = callCount === 0 ? mockVideo1 : mockVideo2;
      (route as any).callCount = callCount + 1;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [videoToReturn]
        }),
      })
    })

    // Mock video detail for video 2
    await page.route(`**/api/videos/${mockVideo2.video_id}`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockVideo2),
      })
    })

    // Step 1: Navigate to random page and get first video
    await page.goto('/random')
    await page.getByRole('button', { name: 'シャッフル' }).first().click()
    await expect(page.getByText(mockVideo1.title)).toBeVisible()

    // Step 2: Navigate to detail page and back
    await page.getByText(mockVideo1.title).click()
    await expect(page).toHaveURL(new RegExp(`/video\\?id=${mockVideo1.video_id}`))
    await page.goBack()
    await expect(page).toHaveURL('/random')

    // Step 3: Verify original video is still there
    await expect(page.getByText(mockVideo1.title)).toBeVisible()

    // Step 4: Click shuffle button to get new video
    await page.getByRole('button', { name: 'シャッフル' }).first().click()

    // Step 5: Verify new video is loaded
    await expect(page.getByText(mockVideo2.title)).toBeVisible()
    await expect(page.getByText(mockVideo1.title)).not.toBeVisible()

    // Step 6: Verify original video is now in history
    await expect(page.getByText('過去の選出')).toBeVisible()
  })

  test.skip('should handle empty sessionStorage gracefully on first visit', async ({ page }) => {
    // Clear sessionStorage before test
    await page.evaluate(() => {
      sessionStorage.clear()
    })

    // Navigate to random page
    await page.goto('/random')

    // Should show empty state initially
    await expect(page.getByText('シャッフルして動画を発見しよう')).toBeVisible()
    await expect(page.getByText('最初のシャッフル')).toBeVisible()

    // Click initial shuffle
    await page.getByRole('button', { name: '最初のシャッフル' }).click()

    // Video should load
    await expect(page.getByText(mockVideo1.title)).toBeVisible()

    // Verify sessionStorage is populated
    const sessionStorageData = await page.evaluate(() => {
      const data = sessionStorage.getItem('randomPageState')
      return data ? JSON.parse(data) : null
    })

    expect(sessionStorageData).not.toBeNull()
    expect(sessionStorageData.currentVideo).toEqual(mockVideo1)
  })

  test.skip('should preserve history when navigating back from video detail', async ({ page }) => {
    // Setup multiple videos for history
    let callCount = 0;
    await page.route('**/api/videos/random?count=1', async route => {
      const videoToReturn = callCount === 0 ? mockVideo1 : mockVideo2;
      callCount++;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [videoToReturn]
        }),
      })
    })

    // Navigate to random page
    await page.goto('/random')

    // Get first video
    await page.getByRole('button', { name: 'シャッフル' }).first().click()
    await expect(page.getByText(mockVideo1.title)).toBeVisible()

    // Shuffle to get second video (mockVideo1 goes to history)
    await page.getByRole('button', { name: 'シャッフル' }).first().click()
    await expect(page.getByText(mockVideo2.title)).toBeVisible()

    // Should have history section
    await expect(page.getByText('過去の選出')).toBeVisible()

    // Navigate to detail page and back
    await page.getByText(mockVideo2.title).click()
    await page.goBack()

    // Verify current video and history are preserved
    await expect(page.getByText(mockVideo2.title)).toBeVisible()
    await expect(page.getByText('過去の選出')).toBeVisible()

    // Verify sessionStorage contains both current video and history
    const sessionStorageData = await page.evaluate(() => {
      const data = sessionStorage.getItem('randomPageState')
      return data ? JSON.parse(data) : null
    })

    expect(sessionStorageData).not.toBeNull()
    expect(sessionStorageData.currentVideo.video_id).toBe(mockVideo2.video_id)
    expect(sessionStorageData.history).toHaveLength(1)
    expect(sessionStorageData.history[0].video_id).toBe(mockVideo1.video_id)
  })

  test.skip('should handle network errors gracefully during navigation', async ({ page }) => {
    // Setup initial successful load
    await page.goto('/random')
    await page.getByRole('button', { name: 'シャッフル' }).first().click()
    await expect(page.getByText(mockVideo1.title)).toBeVisible()

    // Mock network error for video detail
    await page.route(`**/api/videos/${mockVideo1.video_id}`, async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    })

    // Try to navigate to detail page
    await page.getByText(mockVideo1.title).click()

    // Should show error state in video detail page
    await expect(page).toHaveURL(new RegExp(`/video\\?id=${mockVideo1.video_id}`))

    // Navigate back
    await page.goBack()

    // Random page should still work and show the same video
    await expect(page).toHaveURL('/random')
    await expect(page.getByText(mockVideo1.title)).toBeVisible()
  })
})
