import { test, expect } from '@playwright/test';

test.describe('検索ページ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/search');
  });

  test('検索ページが正しく読み込まれる', async ({ page }) => {
    await expect(page).toHaveTitle(/検索.*白雪巴ファンサイト/);
    
    // ページヘッダーの確認
    const pageTitle = page.locator('h1');
    await expect(pageTitle).toContainText('検索');
  });

  test('検索フォームが表示される', async ({ page }) => {
    // 検索入力フィールドの確認
    const searchInput = page.locator('[data-testid="search-input"], input[type="search"], input[name="q"]');
    await expect(searchInput).toBeVisible();
    
    // 検索ボタンの確認
    const searchButton = page.locator('[data-testid="search-button"], button[type="submit"], button:has-text("検索")');
    await expect(searchButton).toBeVisible();
  });

  test('基本的な検索が機能する', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"], input[type="search"], input[name="q"]');
    const searchButton = page.locator('[data-testid="search-button"], button[type="submit"], button:has-text("検索")');
    
    // 検索キーワードを入力
    await searchInput.fill('ゲーム実況');
    await searchButton.click();
    
    // 検索結果が表示されることを確認
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/q=.*ゲーム実況/);
    
    // 検索結果の表示確認
    const searchResults = page.locator('[data-testid="search-results"], .search-results');
    await expect(searchResults).toBeVisible();
  });

  test('高度な検索フィルターが機能する', async ({ page }) => {
    // 高度な検索セクションを開く
    const advancedSearchToggle = page.locator('[data-testid="advanced-search-toggle"], .advanced-search-toggle, button:has-text("詳細検索")');
    
    if (await advancedSearchToggle.isVisible()) {
      await advancedSearchToggle.click();
      
      // 高度な検索オプションが表示されることを確認
      const advancedOptions = page.locator('[data-testid="advanced-search-options"], .advanced-search-options');
      await expect(advancedOptions).toBeVisible();
      
      // タグフィルター
      const tagFilter = page.locator('[data-testid="tag-filter"], select[name="tags"], .tag-selector');
      if (await tagFilter.isVisible()) {
        await tagFilter.selectOption({ index: 1 }); // 最初のオプションを選択
      }
      
      // 日付範囲フィルター
      const dateFromInput = page.locator('[data-testid="date-from"], input[name="date_from"], input[type="date"]').first();
      if (await dateFromInput.isVisible()) {
        await dateFromInput.fill('2023-01-01');
      }
      
      const dateToInput = page.locator('[data-testid="date-to"], input[name="date_to"], input[type="date"]').last();
      if (await dateToInput.isVisible()) {
        await dateToInput.fill('2023-12-31');
      }
      
      // 検索実行
      const searchButton = page.locator('[data-testid="search-button"], button[type="submit"], button:has-text("検索")');
      await searchButton.click();
      
      // フィルターが適用されることを確認
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/date_from=2023-01-01/);
    }
  });

  test('検索結果のソート機能', async ({ page }) => {
    // まず検索を実行
    const searchInput = page.locator('[data-testid="search-input"], input[type="search"], input[name="q"]');
    await searchInput.fill('配信');
    await searchInput.press('Enter');
    
    await page.waitForLoadState('networkidle');
    
    // ソートオプションの確認
    const sortSelect = page.locator('[data-testid="sort-select"], select[name="sort"], .sort-selector');
    
    if (await sortSelect.isVisible()) {
      // 日付順でソート
      await sortSelect.selectOption('date');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/sort=date/);
      
      // 視聴回数順でソート
      await sortSelect.selectOption('views');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/sort=views/);
    }
  });

  test('検索候補・オートコンプリート機能', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"], input[type="search"], input[name="q"]');
    
    // 検索キーワードを部分的に入力
    await searchInput.fill('ゲー');
    
    // オートコンプリートの候補が表示されることを確認
    const suggestions = page.locator('[data-testid="search-suggestions"], .search-suggestions, .autocomplete');
    
    if (await suggestions.isVisible({ timeout: 3000 })) {
      // 候補の一つをクリック
      const firstSuggestion = suggestions.locator('li, .suggestion-item').first();
      await firstSuggestion.click();
      
      // 選択された候補が入力フィールドに反映されることを確認
      const inputValue = await searchInput.inputValue();
      expect(inputValue.length).toBeGreaterThan(3);
    }
  });

  test('検索履歴機能', async ({ page }) => {
    // 複数の検索を実行
    const searchInput = page.locator('[data-testid="search-input"], input[type="search"], input[name="q"]');
    const searchTerms = ['ゲーム実況', 'ホラー', '雑談'];
    
    for (const term of searchTerms) {
      await searchInput.fill(term);
      await searchInput.press('Enter');
      await page.waitForLoadState('networkidle');
      await page.goBack();
    }
    
    // 検索履歴が表示されることを確認
    const searchHistory = page.locator('[data-testid="search-history"], .search-history');
    
    if (await searchHistory.isVisible()) {
      // 履歴から検索語を選択
      const historyItem = searchHistory.locator('button, a').first();
      await historyItem.click();
      
      // 選択された検索語で検索が実行されることを確認
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/q=/);
    }
  });

  test('検索結果の表示形式切り替え', async ({ page }) => {
    // 検索を実行
    const searchInput = page.locator('[data-testid="search-input"], input[type="search"], input[name="q"]');
    await searchInput.fill('配信');
    await searchInput.press('Enter');
    
    await page.waitForLoadState('networkidle');
    
    // 表示形式切り替えボタンの確認
    const viewToggle = page.locator('[data-testid="view-toggle"], .view-toggle');
    
    if (await viewToggle.isVisible()) {
      // グリッドビューとリストビューの切り替え
      const listViewButton = viewToggle.locator('button[data-view="list"], .list-view');
      const gridViewButton = viewToggle.locator('button[data-view="grid"], .grid-view');
      
      if (await listViewButton.isVisible()) {
        await listViewButton.click();
        
        // リストビューが適用されることを確認
        const listContainer = page.locator('[data-view="list"], .list-container');
        await expect(listContainer).toBeVisible();
      }
      
      if (await gridViewButton.isVisible()) {
        await gridViewButton.click();
        
        // グリッドビューが適用されることを確認
        const gridContainer = page.locator('[data-view="grid"], .grid-container');
        await expect(gridContainer).toBeVisible();
      }
    }
  });

  test('検索結果のページネーション', async ({ page }) => {
    // 検索を実行
    const searchInput = page.locator('[data-testid="search-input"], input[type="search"], input[name="q"]');
    await searchInput.fill('配信');
    await searchInput.press('Enter');
    
    await page.waitForLoadState('networkidle');
    
    // ページネーションの確認
    const pagination = page.locator('[data-testid="pagination"], .pagination');
    
    if (await pagination.isVisible()) {
      const nextButton = pagination.locator('button:has-text("次"), .next-page');
      
      if (await nextButton.isVisible() && await nextButton.isEnabled()) {
        await nextButton.click();
        
        // 次のページに移動することを確認
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/page=2|offset=/);
      }
    }
  });

  test('空の検索結果の処理', async ({ page }) => {
    // 存在しないキーワードで検索
    const searchInput = page.locator('[data-testid="search-input"], input[type="search"], input[name="q"]');
    await searchInput.fill('存在しないキーワード12345');
    await searchInput.press('Enter');
    
    await page.waitForLoadState('networkidle');
    
    // 「結果が見つかりません」メッセージの確認
    const noResultsMessage = page.locator('[data-testid="no-results"], .no-results, .empty-state');
    await expect(noResultsMessage).toBeVisible();
    await expect(noResultsMessage).toContainText(/結果.*見つかりません|該当.*ありません/);
  });

  test('検索エラーの処理', async ({ page }) => {
    // APIエラーをシミュレート
    await page.route('**/api/search**', route => {
      route.abort('failed');
    });
    
    const searchInput = page.locator('[data-testid="search-input"], input[type="search"], input[name="q"]');
    await searchInput.fill('テスト');
    await searchInput.press('Enter');
    
    // エラーメッセージが表示されることを確認
    const errorMessage = page.locator('[data-testid="error-message"], .error, .alert-error');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('検索フィルターのクリア機能', async ({ page }) => {
    // 高度な検索でフィルターを設定
    const advancedSearchToggle = page.locator('[data-testid="advanced-search-toggle"], .advanced-search-toggle, button:has-text("詳細検索")');
    
    if (await advancedSearchToggle.isVisible()) {
      await advancedSearchToggle.click();
      
      // フィルターを設定
      const tagFilter = page.locator('[data-testid="tag-filter"], select[name="tags"]');
      if (await tagFilter.isVisible()) {
        await tagFilter.selectOption({ index: 1 });
      }
      
      // 検索実行
      const searchButton = page.locator('[data-testid="search-button"], button[type="submit"]');
      await searchButton.click();
      await page.waitForLoadState('networkidle');
      
      // フィルタークリアボタンの確認
      const clearFiltersButton = page.locator('[data-testid="clear-filters"], .clear-filters, button:has-text("クリア")');
      
      if (await clearFiltersButton.isVisible()) {
        await clearFiltersButton.click();
        
        // フィルターがクリアされることを確認
        await page.waitForLoadState('networkidle');
        const currentUrl = page.url();
        expect(currentUrl).not.toMatch(/tags=/);
      }
    }
  });

  test('キーボードショートカット', async ({ page }) => {
    // Ctrl+K または Cmd+K で検索フィールドにフォーカス
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';
    
    await page.keyboard.press(`${modifier}+KeyK`);
    
    // 検索入力フィールドにフォーカスが当たることを確認
    const searchInput = page.locator('[data-testid="search-input"], input[type="search"], input[name="q"]');
    await expect(searchInput).toBeFocused();
  });
});