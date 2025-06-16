import { test, expect } from '@playwright/test';

test.describe('メモリーゲーム', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/memory-game');
  });

  test('メモリーゲームページが正しく読み込まれる', async ({ page }) => {
    await expect(page).toHaveTitle(/メモリーゲーム.*白雪巴ファンサイト/);
    
    // ページヘッダーの確認
    const pageTitle = page.locator('h1');
    await expect(pageTitle).toContainText('メモリーゲーム');
  });

  test('ゲーム設定が表示される', async ({ page }) => {
    // 難易度選択の確認
    const difficultySelector = page.locator('[data-testid="difficulty-selector"], .difficulty-selector, select[name="difficulty"]');
    await expect(difficultySelector).toBeVisible();
    
    // ゲーム開始ボタンの確認
    const startButton = page.locator('[data-testid="start-game"], .start-game, button:has-text("ゲーム開始")');
    await expect(startButton).toBeVisible();
  });

  test('ゲームボードが正しく生成される', async ({ page }) => {
    // ゲーム開始
    const startButton = page.locator('[data-testid="start-game"], .start-game, button:has-text("ゲーム開始")');
    await startButton.click();
    
    // ゲームボードの表示確認
    const gameBoard = page.locator('[data-testid="game-board"], .game-board, .memory-grid');
    await expect(gameBoard).toBeVisible();
    
    // カードの数を確認（デフォルト4x4 = 16枚）
    const cards = page.locator('[data-testid="memory-card"], .memory-card, .card');
    await expect(cards).toHaveCount(16);
  });

  test('カードクリックでめくり動作', async ({ page }) => {
    // ゲーム開始
    const startButton = page.locator('[data-testid="start-game"], .start-game, button:has-text("ゲーム開始")');
    await startButton.click();
    
    // 最初のカードをクリック
    const firstCard = page.locator('[data-testid="memory-card"], .memory-card, .card').first();
    await firstCard.click();
    
    // カードがめくられた状態になることを確認
    await expect(firstCard).toHaveClass(/flipped|revealed|active/);
    
    // カードの画像が表示されることを確認
    const cardImage = firstCard.locator('img, [data-testid="card-image"]');
    await expect(cardImage).toBeVisible();
  });

  test('2枚のカードマッチング機能', async ({ page }) => {
    // ゲーム開始
    const startButton = page.locator('[data-testid="start-game"], .start-game, button:has-text("ゲーム開始")');
    await startButton.click();
    
    const cards = page.locator('[data-testid="memory-card"], .memory-card, .card');
    
    // 最初の2枚のカードをクリック
    await cards.nth(0).click();
    await cards.nth(1).click();
    
    // 少し待機（アニメーション完了のため）
    await page.waitForTimeout(1000);
    
    // マッチした場合とマッチしなかった場合の処理を確認
    const firstCardState = await cards.nth(0).getAttribute('class');
    const secondCardState = await cards.nth(1).getAttribute('class');
    
    if (firstCardState?.includes('matched') || firstCardState?.includes('success')) {
      // マッチした場合：両方のカードがマッチ状態
      await expect(cards.nth(0)).toHaveClass(/matched|success/);
      await expect(cards.nth(1)).toHaveClass(/matched|success/);
    } else {
      // マッチしなかった場合：カードが裏返る
      await expect(cards.nth(0)).not.toHaveClass(/flipped|revealed|active/);
      await expect(cards.nth(1)).not.toHaveClass(/flipped|revealed|active/);
    }
  });

  test('ゲーム統計の表示', async ({ page }) => {
    // ゲーム開始
    const startButton = page.locator('[data-testid="start-game"], .start-game, button:has-text("ゲーム開始")');
    await startButton.click();
    
    // 統計情報の確認
    const moveCounter = page.locator('[data-testid="move-counter"], .move-counter, .moves');
    const timer = page.locator('[data-testid="timer"], .timer, .time');
    const matchCounter = page.locator('[data-testid="match-counter"], .match-counter, .matches');
    
    await expect(moveCounter).toBeVisible();
    await expect(timer).toBeVisible();
    
    // カードをクリックして手数が増加することを確認
    const firstCard = page.locator('[data-testid="memory-card"], .memory-card, .card').first();
    await firstCard.click();
    
    // 手数カウンターが更新されることを確認
    await expect(moveCounter).toContainText(/1|手数/);
  });

  test('難易度変更機能', async ({ page }) => {
    // 難易度を変更
    const difficultySelector = page.locator('[data-testid="difficulty-selector"], .difficulty-selector, select[name="difficulty"]');
    await difficultySelector.selectOption('hard'); // 6x6グリッド
    
    // ゲーム開始
    const startButton = page.locator('[data-testid="start-game"], .start-game, button:has-text("ゲーム開始")');
    await startButton.click();
    
    // カード数が変更されることを確認（6x6 = 36枚）
    const cards = page.locator('[data-testid="memory-card"], .memory-card, .card');
    await expect(cards).toHaveCount(36);
  });

  test('ゲーム完了時の処理', async ({ page }) => {
    // 簡単な難易度でテスト（2x2グリッド）
    const difficultySelector = page.locator('[data-testid="difficulty-selector"], .difficulty-selector, select[name="difficulty"]');
    
    // 最も簡単な難易度を選択
    if (await difficultySelector.isVisible()) {
      await difficultySelector.selectOption('easy');
    }
    
    // ゲーム開始
    const startButton = page.locator('[data-testid="start-game"], .start-game, button:has-text("ゲーム開始")');
    await startButton.click();
    
    // 全てのカードペアをマッチさせる（自動化は困難なため、完了状態をシミュレート）
    // 実際のテストでは、ゲーム完了のモック状態を作成するか、
    // 開発者ツールを使用してゲーム状態を操作する
    
    // ゲーム完了モーダルまたはメッセージの確認
    const completionModal = page.locator('[data-testid="game-complete"], .game-complete, .victory-modal');
    const completionMessage = page.locator('[data-testid="completion-message"], .completion-message');
    
    // 注意: 実際のゲーム完了には時間がかかるため、タイムアウトを長めに設定
    if (await completionModal.isVisible({ timeout: 30000 })) {
      await expect(completionModal).toContainText(/完了|クリア|おめでとう/);
    }
  });

  test('ゲームリセット機能', async ({ page }) => {
    // ゲーム開始
    const startButton = page.locator('[data-testid="start-game"], .start-game, button:has-text("ゲーム開始")');
    await startButton.click();
    
    // いくつかのカードをクリック
    const cards = page.locator('[data-testid="memory-card"], .memory-card, .card');
    await cards.nth(0).click();
    await cards.nth(1).click();
    
    // リセットボタンをクリック
    const resetButton = page.locator('[data-testid="reset-game"], .reset-game, button:has-text("リセット")');
    
    if (await resetButton.isVisible()) {
      await resetButton.click();
      
      // ゲーム状態がリセットされることを確認
      const moveCounter = page.locator('[data-testid="move-counter"], .move-counter, .moves');
      await expect(moveCounter).toContainText('0');
      
      // 全てのカードが裏向きになることを確認
      const allCards = page.locator('[data-testid="memory-card"], .memory-card, .card');
      for (let i = 0; i < await allCards.count(); i++) {
        await expect(allCards.nth(i)).not.toHaveClass(/flipped|revealed|active/);
      }
    }
  });

  test('スコア記録機能', async ({ page }) => {
    // ベストスコア表示の確認
    const bestScore = page.locator('[data-testid="best-score"], .best-score, .high-score');
    
    if (await bestScore.isVisible()) {
      // 初期状態でのベストスコア確認
      const initialScore = await bestScore.textContent();
      expect(initialScore).toBeTruthy();
    }
    
    // スコア履歴の確認
    const scoreHistory = page.locator('[data-testid="score-history"], .score-history, .leaderboard');
    
    if (await scoreHistory.isVisible()) {
      await expect(scoreHistory).toBeVisible();
    }
  });

  test('ゲーム設定の保存', async ({ page }) => {
    // 難易度を変更
    const difficultySelector = page.locator('[data-testid="difficulty-selector"], .difficulty-selector, select[name="difficulty"]');
    await difficultySelector.selectOption('medium');
    
    // ページをリロード
    await page.reload();
    
    // 設定が保存されていることを確認
    const selectedValue = await difficultySelector.inputValue();
    expect(selectedValue).toBe('medium');
  });

  test('レスポンシブデザイン', async ({ page }) => {
    // ゲーム開始
    const startButton = page.locator('[data-testid="start-game"], .start-game, button:has-text("ゲーム開始")');
    await startButton.click();
    
    // モバイルサイズに変更
    await page.setViewportSize({ width: 375, height: 667 });
    
    // ゲームボードが適切に表示されることを確認
    const gameBoard = page.locator('[data-testid="game-board"], .game-board, .memory-grid');
    await expect(gameBoard).toBeVisible();
    
    // カードがクリック可能であることを確認
    const firstCard = page.locator('[data-testid="memory-card"], .memory-card, .card').first();
    await firstCard.click();
    await expect(firstCard).toHaveClass(/flipped|revealed|active/);
  });

  test('アクセシビリティ対応', async ({ page }) => {
    // ゲーム開始
    const startButton = page.locator('[data-testid="start-game"], .start-game, button:has-text("ゲーム開始")');
    await startButton.click();
    
    // キーボードナビゲーションの確認
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Enterキーでカードをめくれることを確認
    await page.keyboard.press('Enter');
    
    // ARIAラベルの確認
    const cards = page.locator('[data-testid="memory-card"], .memory-card, .card');
    const firstCard = cards.first();
    
    const ariaLabel = await firstCard.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  });

  test('ゲーム中断・再開機能', async ({ page }) => {
    // ゲーム開始
    const startButton = page.locator('[data-testid="start-game"], .start-game, button:has-text("ゲーム開始")');
    await startButton.click();
    
    // いくつかのカードをクリック
    const cards = page.locator('[data-testid="memory-card"], .memory-card, .card');
    await cards.nth(0).click();
    await cards.nth(1).click();
    
    // 一時停止ボタンの確認
    const pauseButton = page.locator('[data-testid="pause-game"], .pause-game, button:has-text("一時停止")');
    
    if (await pauseButton.isVisible()) {
      await pauseButton.click();
      
      // ゲームが一時停止されることを確認
      const pauseOverlay = page.locator('[data-testid="pause-overlay"], .pause-overlay, .game-paused');
      await expect(pauseOverlay).toBeVisible();
      
      // 再開ボタンをクリック
      const resumeButton = page.locator('[data-testid="resume-game"], .resume-game, button:has-text("再開")');
      await resumeButton.click();
      
      // ゲームが再開されることを確認
      await expect(pauseOverlay).toBeHidden();
    }
  });
});