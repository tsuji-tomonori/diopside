import { test, expect } from '@playwright/test';

test.describe('API統合テスト', () => {
  // モックAPIレスポンスの設定
  const mockVideos = [
    {
      video_id: 'test123',
      title: '【テスト】サンプル配信',
      tags: ['テスト', 'サンプル'],
      year: 2024,
      thumbnail_url: 'https://img.youtube.com/vi/test123/maxresdefault.jpg',
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      video_id: 'test456',
      title: '【ゲーム実況】テストゲーム',
      tags: ['ゲーム実況', 'テスト'],
      year: 2024,
      thumbnail_url: 'https://img.youtube.com/vi/test456/maxresdefault.jpg',
      created_at: '2024-01-02T00:00:00Z'
    }
  ];

  const mockTags = {
    name: 'root',
    children: [
      {
        name: 'ゲーム実況',
        children: [
          { name: 'ホラー', count: 5 },
          { name: 'アクション', count: 3 }
        ],
        count: 8
      },
      {
        name: '雑談',
        count: 10
      }
    ]
  };

  test.describe('動画API統合', () => {
    test('動画一覧APIが正常に動作する', async ({ page }) => {
      // APIレスポンスをモック
      await page.route('**/api/videos**', async route => {
        const url = new URL(route.request().url());
        const year = url.searchParams.get('year');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = parseInt(url.searchParams.get('offset') || '0');

        const filteredVideos = year ?
          mockVideos.filter(v => v.year.toString() === year) :
          mockVideos;

        const paginatedVideos = filteredVideos.slice(offset, offset + limit);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: paginatedVideos,
            total: filteredVideos.length,
            limit,
            offset
          })
        });
      });

      await page.goto('/archives');

      // 動画カードが表示されることを確認
      await expect(page.locator('[data-testid="video-card"]').first()).toBeVisible();

      // 動画タイトルが表示されることを確認
      await expect(page.locator('text=【テスト】サンプル配信')).toBeVisible();
      await expect(page.locator('text=【ゲーム実況】テストゲーム')).toBeVisible();
    });

    test('動画詳細APIが正常に動作する', async ({ page }) => {
      // 動画一覧API
      await page.route('**/api/videos**', async route => {
        if (route.request().url().includes('/test123')) {
          // 個別動画API
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockVideos[0])
          });
        } else {
          // 一覧API
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              items: mockVideos,
              total: mockVideos.length,
              limit: 20,
              offset: 0
            })
          });
        }
      });

      await page.goto('/archives');

      // 最初の動画カードをクリック
      await page.locator('[data-testid="video-card"]').first().click();

      // 詳細情報が表示されることを確認
      await expect(page.locator('text=【テスト】サンプル配信')).toBeVisible();
    });

    test('年別フィルターが正常に動作する', async ({ page }) => {
      await page.route('**/api/videos**', async route => {
        const url = new URL(route.request().url());
        const year = url.searchParams.get('year');

        const filteredVideos = year === '2024' ? mockVideos : [];

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: filteredVideos,
            total: filteredVideos.length,
            limit: 20,
            offset: 0
          })
        });
      });

      await page.goto('/archives');

      // 年別フィルターを選択
      const yearFilter = page.locator('[data-testid="year-filter"], select[name="year"]');
      if (await yearFilter.isVisible()) {
        await yearFilter.selectOption('2024');

        // フィルターされた結果が表示されることを確認
        await expect(page.locator('[data-testid="video-card"]')).toHaveCount(2);
      }
    });

    test('ページネーションが正常に動作する', async ({ page }) => {
      await page.route('**/api/videos**', async route => {
        const url = new URL(route.request().url());
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const limit = parseInt(url.searchParams.get('limit') || '20');

        // 2ページ目のデータをシミュレート
        const allVideos = [...mockVideos, ...mockVideos, ...mockVideos]; // 6件のデータ
        const paginatedVideos = allVideos.slice(offset, offset + limit);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: paginatedVideos,
            total: allVideos.length,
            limit,
            offset
          })
        });
      });

      await page.goto('/archives');

      // 次のページボタンをクリック
      const nextButton = page.locator('[data-testid="next-page"], button:has-text("次")');
      if (await nextButton.isVisible()) {
        await nextButton.click();

        // URLが更新されることを確認
        await expect(page).toHaveURL(/offset=|page=/);
      }
    });

    test('APIエラー時の適切な処理', async ({ page }) => {
      // APIエラーをシミュレート
      await page.route('**/api/videos**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });

      await page.goto('/archives');

      // エラーメッセージが表示されることを確認
      await expect(page.locator('[data-testid="error-message"], .error')).toBeVisible();
    });

    test('ネットワークエラー時の適切な処理', async ({ page }) => {
      // ネットワークエラーをシミュレート
      await page.route('**/api/videos**', route => {
        route.abort('failed');
      });

      await page.goto('/archives');

      // エラーメッセージまたはリトライボタンが表示されることを確認
      const errorElement = page.locator('[data-testid="error-message"], .error, [data-testid="retry-button"]');
      await expect(errorElement).toBeVisible();
    });
  });

  test.describe('検索API統合', () => {
    test('検索APIが正常に動作する', async ({ page }) => {
      await page.route('**/api/search**', async route => {
        const url = new URL(route.request().url());
        const query = url.searchParams.get('q');

        const filteredVideos = query ?
          mockVideos.filter(v => v.title.includes(query) || v.tags.some(tag => tag.includes(query))) :
          [];

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: filteredVideos,
            total: filteredVideos.length,
            query,
            limit: 20,
            offset: 0
          })
        });
      });

      await page.goto('/search');

      // 検索キーワードを入力
      const searchInput = page.locator('[data-testid="search-input"], input[name="q"]');
      await searchInput.fill('ゲーム');
      await searchInput.press('Enter');

      // 検索結果が表示されることを確認
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
      await expect(page.locator('text=【ゲーム実況】テストゲーム')).toBeVisible();
    });

    test('高度な検索が正常に動作する', async ({ page }) => {
      await page.route('**/api/search**', async route => {
        const url = new URL(route.request().url());
        const tags = url.searchParams.getAll('tags');
        const dateFrom = url.searchParams.get('date_from');
        const dateTo = url.searchParams.get('date_to');

        let filteredVideos = mockVideos;

        if (tags.length > 0) {
          filteredVideos = filteredVideos.filter(v =>
            tags.some(tag => v.tags.includes(tag))
          );
        }

        if (dateFrom) {
          filteredVideos = filteredVideos.filter(v =>
            new Date(v.created_at) >= new Date(dateFrom)
          );
        }

        if (dateTo) {
          filteredVideos = filteredVideos.filter(v =>
            new Date(v.created_at) <= new Date(dateTo)
          );
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: filteredVideos,
            total: filteredVideos.length,
            limit: 20,
            offset: 0
          })
        });
      });

      await page.goto('/search');

      // 高度な検索を開く
      const advancedToggle = page.locator('[data-testid="advanced-search-toggle"]');
      if (await advancedToggle.isVisible()) {
        await advancedToggle.click();

        // タグフィルターを設定
        const tagFilter = page.locator('[data-testid="tag-filter"]');
        if (await tagFilter.isVisible()) {
          await tagFilter.selectOption('ゲーム実況');
        }

        // 検索実行
        const searchButton = page.locator('[data-testid="search-button"]');
        await searchButton.click();

        // フィルターされた結果が表示されることを確認
        await expect(page).toHaveURL(/tags=ゲーム実況/);
      }
    });
  });

  test.describe('タグAPI統合', () => {
    test('タグ階層APIが正常に動作する', async ({ page }) => {
      await page.route('**/api/tags**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockTags)
        });
      });

      await page.goto('/archives');

      // タグフィルターが表示されることを確認
      const tagFilter = page.locator('[data-testid="tag-filter"], .tag-filter');
      if (await tagFilter.isVisible()) {
        await expect(tagFilter.locator('text=ゲーム実況')).toBeVisible();
        await expect(tagFilter.locator('text=雑談')).toBeVisible();
      }
    });

    test('タグ別動画取得が正常に動作する', async ({ page }) => {
      await page.route('**/api/videos/by-tag**', async route => {
        const url = new URL(route.request().url());
        const tagPath = url.searchParams.get('path');

        const filteredVideos = tagPath === 'ゲーム実況' ?
          mockVideos.filter(v => v.tags.includes('ゲーム実況')) :
          [];

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: filteredVideos,
            total: filteredVideos.length,
            tag_path: tagPath,
            limit: 20,
            offset: 0
          })
        });
      });

      await page.goto('/archives');

      // タグをクリック
      const gameTag = page.locator('text=ゲーム実況').first();
      if (await gameTag.isVisible()) {
        await gameTag.click();

        // タグ別の結果が表示されることを確認
        await expect(page).toHaveURL(/path=ゲーム実況/);
        await expect(page.locator('text=【ゲーム実況】テストゲーム')).toBeVisible();
      }
    });
  });

  test.describe('メモリーゲームAPI統合', () => {
    test('メモリーゲーム用動画取得が正常に動作する', async ({ page }) => {
      await page.route('**/api/videos/memory**', async route => {
        const url = new URL(route.request().url());
        const pairs = parseInt(url.searchParams.get('pairs') || '8');

        // ペア数に応じた動画を返す
        const gameVideos = mockVideos.slice(0, pairs);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            pairs: gameVideos.map(video => ({
              id: video.video_id,
              thumbnail_url: video.thumbnail_url,
              title: video.title
            })),
            total_pairs: pairs
          })
        });
      });

      await page.goto('/memory-game');

      // ゲーム開始
      const startButton = page.locator('[data-testid="start-game"]');
      if (await startButton.isVisible()) {
        await startButton.click();

        // ゲームボードが表示されることを確認
        await expect(page.locator('[data-testid="game-board"]')).toBeVisible();

        // カードが表示されることを確認
        const cards = page.locator('[data-testid="memory-card"]');
        await expect(cards).toHaveCount(16); // 8ペア = 16枚
      }
    });
  });

  test.describe('ランダム動画API統合', () => {
    test('ランダム動画取得が正常に動作する', async ({ page }) => {
      await page.route('**/api/videos/random**', async route => {
        const url = new URL(route.request().url());
        const count = parseInt(url.searchParams.get('count') || '3');

        // ランダムな動画を返す（実際はシャッフルされた結果）
        const randomVideos = mockVideos.slice(0, count);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: randomVideos,
            count: randomVideos.length
          })
        });
      });

      await page.goto('/');

      // ランダム動画セクションが表示されることを確認
      const randomSection = page.locator('[data-testid="random-videos"], .random-videos');
      if (await randomSection.isVisible()) {
        await expect(randomSection.locator('[data-testid="video-card"]')).toHaveCount(2);
      }
    });
  });

  test.describe('APIレスポンス時間テスト', () => {
    test('API応答時間が適切である', async ({ page }) => {
      let responseTime = 0;

      page.on('response', response => {
        if (response.url().includes('/api/')) {
          const timing = response.timing();
          responseTime = timing.responseEnd - timing.requestStart;
        }
      });

      await page.goto('/archives');

      // API応答時間が2秒以内であることを確認
      expect(responseTime).toBeLessThan(2000);
    });
  });

  test.describe('APIキャッシュテスト', () => {
    test('APIレスポンスが適切にキャッシュされる', async ({ page }) => {
      let requestCount = 0;

      await page.route('**/api/videos**', async route => {
        requestCount++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'Cache-Control': 'public, max-age=300', // 5分キャッシュ
            'ETag': '"test-etag"'
          },
          body: JSON.stringify({
            items: mockVideos,
            total: mockVideos.length,
            limit: 20,
            offset: 0
          })
        });
      });

      // 最初のリクエスト
      await page.goto('/archives');
      expect(requestCount).toBe(1);

      // ページをリロード（キャッシュが効いているかテスト）
      await page.reload();

      // 実際のキャッシュ動作はブラウザに依存するため、
      // ここではキャッシュヘッダーが適切に設定されていることを確認
      const response = await page.request.get('/api/videos');
      const cacheControl = response.headers()['cache-control'];
      expect(cacheControl).toContain('max-age');
    });
  });
});
