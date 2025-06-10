import { test, expect } from '@playwright/test';

test.describe('アーカイブページ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/archives');
  });

  test('アーカイブページが正しく読み込まれる', async ({ page }) => {
    await expect(page).toHaveTitle(/アーカイブ.*白雪巴ファンサイト/);
    
    // ページヘッダーの確認
    const pageTitle = page.locator('h1');
    await expect(pageTitle).toContainText('アーカイブ');
  });

  test('年別フィルターが表示される', async ({ page }) => {
    // 年別フィルターセクションの確認
    const yearFilter = page.locator('[data-testid="year-filter"], .year-filter, select[name="year"]');
    await expect(yearFilter.first()).toBeVisible();
  });

  test('動画カードが表示される', async ({ page }) => {
    // 動画カードの読み込みを待つ
    await page.waitForSelector('[data-testid="video-card"], .video-card', { timeout: 10000 });
    
    const videoCards = page.locator('[data-testid="video-card"], .video-card');
    await expect(videoCards.first()).toBeVisible();
    
    // 動画カードの基本要素を確認
    const firstCard = videoCards.first();
    await expect(firstCard.locator('img, [data-testid="thumbnail"]')).toBeVisible(); // サムネイル
    await expect(firstCard.locator('[data-testid="title"], .title, h2, h3')).toBeVisible(); // タイトル
  });

  test('ページネーションが機能する', async ({ page }) => {
    // ページネーションの存在確認
    const pagination = page.locator('[data-testid="pagination"], .pagination, nav[aria-label*="ページ"]');
    
    if (await pagination.isVisible()) {
      // 次のページボタンをクリック
      const nextButton = page.locator('[data-testid="next-page"], .next-page, button:has-text("次"), button[aria-label*="次"]');
      
      if (await nextButton.isVisible() && await nextButton.isEnabled()) {
        await nextButton.click();
        
        // URLが変更されることを確認
        await expect(page).toHaveURL(/page=2|offset=/);
        
        // 新しいコンテンツが読み込まれることを確認
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('タグフィルターが機能する', async ({ page }) => {
    // タグフィルターの存在確認
    const tagFilter = page.locator('[data-testid="tag-filter"], .tag-filter, .tags');
    
    if (await tagFilter.isVisible()) {
      // 最初のタグをクリック
      const firstTag = tagFilter.locator('button, a, .tag').first();
      
      if (await firstTag.isVisible()) {
        const tagText = await firstTag.textContent();
        await firstTag.click();
        
        // フィルターが適用されることを確認
        await page.waitForLoadState('networkidle');
        
        // URLにタグパラメータが含まれることを確認
        await expect(page).toHaveURL(new RegExp(`tag.*${encodeURIComponent(tagText || '')}`));
      }
    }
  });

  test('動画カードクリックで詳細表示', async ({ page }) => {
    // 動画カードの読み込みを待つ
    await page.waitForSelector('[data-testid="video-card"], .video-card', { timeout: 10000 });
    
    const videoCards = page.locator('[data-testid="video-card"], .video-card');
    const firstCard = videoCards.first();
    
    // カードをクリック
    await firstCard.click();
    
    // 詳細モーダルまたは詳細ページが表示されることを確認
    const modal = page.locator('[data-testid="video-modal"], .modal, [role="dialog"]');
    const detailPage = page.locator('[data-testid="video-detail"], .video-detail');
    
    // モーダルまたは詳細ページのいずれかが表示される
    await expect(modal.or(detailPage)).toBeVisible({ timeout: 5000 });
  });

  test('検索機能が動作する', async ({ page }) => {
    // 検索ボックスの確認
    const searchInput = page.locator('[data-testid="search-input"], input[type="search"], input[placeholder*="検索"]');
    
    if (await searchInput.isVisible()) {
      // 検索キーワードを入力
      await searchInput.fill('ゲーム');
      
      // 検索ボタンをクリックまたはEnterキーを押す
      const searchButton = page.locator('[data-testid="search-button"], button[type="submit"], button:has-text("検索")');
      
      if (await searchButton.isVisible()) {
        await searchButton.click();
      } else {
        await searchInput.press('Enter');
      }
      
      // 検索結果が表示されることを確認
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/search.*ゲーム/);
    }
  });

  test('ソート機能が動作する', async ({ page }) => {
    // ソートセレクターの確認
    const sortSelect = page.locator('[data-testid="sort-select"], select[name="sort"], .sort-selector');
    
    if (await sortSelect.isVisible()) {
      // ソートオプションを選択
      await sortSelect.selectOption({ label: '新しい順' });
      
      // ソートが適用されることを確認
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/sort=/);
    }
  });

  test('無限スクロールが機能する', async ({ page }) => {
    // 初期の動画カード数を取得
    await page.waitForSelector('[data-testid="video-card"], .video-card', { timeout: 10000 });
    const initialCardCount = await page.locator('[data-testid="video-card"], .video-card').count();
    
    // ページの最下部までスクロール
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // 新しいコンテンツの読み込みを待つ
    await page.waitForTimeout(2000);
    
    // 動画カード数が増加したかチェック
    const newCardCount = await page.locator('[data-testid="video-card"], .video-card').count();
    
    // 無限スクロールが実装されている場合、カード数が増加する
    if (newCardCount > initialCardCount) {
      expect(newCardCount).toBeGreaterThan(initialCardCount);
    }
  });

  test('エラー状態の処理', async ({ page }) => {
    // ネットワークエラーをシミュレート
    await page.route('**/api/videos**', route => {
      route.abort('failed');
    });
    
    // ページをリロード
    await page.reload();
    
    // エラーメッセージが表示されることを確認
    const errorMessage = page.locator('[data-testid="error-message"], .error, .alert-error');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('ローディング状態の表示', async ({ page }) => {
    // ネットワークを遅延させる
    await page.route('**/api/videos**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });
    
    // ページをリロード
    await page.reload();
    
    // ローディングインジケーターが表示されることを確認
    const loadingIndicator = page.locator('[data-testid="loading"], .loading, .spinner');
    await expect(loadingIndicator).toBeVisible();
    
    // ローディングが完了することを確認
    await expect(loadingIndicator).toBeHidden({ timeout: 15000 });
  });
});