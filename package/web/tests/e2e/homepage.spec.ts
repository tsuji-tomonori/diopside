import { test, expect } from '@playwright/test';

test.describe('ホームページ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('ページタイトルが正しく表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/白雪巴ファンサイト|Diopside/);
  });

  test('メインヘッダーが表示される', async ({ page }) => {
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('ナビゲーションメニューが表示される', async ({ page }) => {
    // ナビゲーションリンクの確認
    await expect(page.locator('nav')).toBeVisible();

    // 主要なナビゲーションリンクの存在確認
    const expectedLinks = ['ホーム', 'アーカイブ', '検索', 'メモリーゲーム'];

    for (const linkText of expectedLinks) {
      const link = page.getByRole('link', { name: linkText });
      await expect(link).toBeVisible();
    }
  });

  test('フッターが表示される', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('レスポンシブデザインが機能する', async ({ page }) => {
    // デスクトップサイズ
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('nav')).toBeVisible();

    // タブレットサイズ
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('nav')).toBeVisible();

    // モバイルサイズ
    await page.setViewportSize({ width: 375, height: 667 });
    // モバイルメニューボタンが表示されることを確認
    const mobileMenuButton = page.locator('[aria-label="メニューを開く"], [aria-label="メニュー"], button[aria-expanded]');
    await expect(mobileMenuButton).toBeVisible();
  });

  test('アクセシビリティ基準を満たす', async ({ page }) => {
    // メインランドマークの存在確認
    await expect(page.locator('main')).toBeVisible();

    // 見出し階層の確認
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    // フォーカス可能な要素のキーボードナビゲーション
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('ダークモード切り替えが機能する', async ({ page }) => {
    // ダークモード切り替えボタンを探す
    const darkModeToggle = page.locator('[aria-label*="ダークモード"], [aria-label*="テーマ"], button[data-theme-toggle]');

    if (await darkModeToggle.isVisible()) {
      // 初期状態を記録
      const initialTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ||
               document.documentElement.getAttribute('data-theme') === 'dark';
      });

      // ダークモード切り替え
      await darkModeToggle.click();

      // テーマが変更されたことを確認
      const newTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ||
               document.documentElement.getAttribute('data-theme') === 'dark';
      });

      expect(newTheme).not.toBe(initialTheme);
    }
  });
});
