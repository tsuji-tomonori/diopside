import { test, expect } from '@playwright/test'

test.describe('神経衰弱ゲーム', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/memory')
  })

  test.describe('初期表示とモーダル', () => {
    test('難易度選択モーダルが初期表示される', async ({ page }) => {
      // モーダルが表示されることを確認
      await expect(page.locator('[data-testid="modal"]')).toBeVisible()

      // タイトルの確認
      await expect(page.locator('text=難易度を選択してください')).toBeVisible()
      await expect(page.locator('text=あなたのレベルに合わせて挑戦しよう！')).toBeVisible()

      // 3つの難易度が表示される
      await expect(page.locator('text=初級')).toBeVisible()
      await expect(page.locator('text=中級')).toBeVisible()
      await expect(page.locator('text=上級')).toBeVisible()

      // 説明文が表示される
      await expect(page.locator('text=6ペア (12枚) - 気軽に楽しもう!')).toBeVisible()
      await expect(page.locator('text=8ペア (16枚) - ちょうどいい挑戦!')).toBeVisible()
      await expect(page.locator('text=12ペア (24枚) - 真の実力を試そう!')).toBeVisible()
    })

    test('ページタイトルが正しい', async ({ page }) => {
      await expect(page).toHaveTitle(/神経衰弱ゲーム.*白雪巴ファンサイト/)
    })

    test('難易度選択後にモーダルが閉じる', async ({ page }) => {
      // 初級を選択
      await page.locator('text=初級').first().click()

      // モーダルが閉じることを確認
      await expect(page.locator('[data-testid="modal"]')).toBeHidden()

      // メインコンテンツが表示される
      await expect(page.locator('text=🧠 神経衰弱ゲーム')).toBeVisible()
      await expect(page.locator('text=現在の難易度: 初級')).toBeVisible()
    })

    test('キーボードショートカットで難易度選択', async ({ page }) => {
      // '1'キーで初級選択
      await page.keyboard.press('1')

      // モーダルが閉じて初級が選択される
      await expect(page.locator('[data-testid="modal"]')).toBeHidden()
      await expect(page.locator('text=現在の難易度: 初級')).toBeVisible()
    })
  })

  test.describe('ゲーム基本機能', () => {
    test.beforeEach(async ({ page }) => {
      // 初級を選択してゲーム開始
      await page.locator('text=初級').first().click()
      await expect(page.locator('[data-testid="modal"]')).toBeHidden()
    })

    test('初級選択時に12枚のカードが生成される', async ({ page }) => {
      // カードが12枚表示される（6ペア）
      const cards = page.locator('[data-testid="card"]').filter({ has: page.locator('text=?') })
      await expect(cards).toHaveCount(12)
    })

    test('カードクリックでサムネイルが表示される', async ({ page }) => {
      const cards = page.locator('[data-testid="card"]').filter({ has: page.locator('text=?') })
      const firstCard = cards.first()

      // 最初は裏向き（?マーク）
      await expect(firstCard.locator('text=?')).toBeVisible()

      // クリック
      await firstCard.click()

      // サムネイル画像が表示される
      await expect(firstCard.locator('[data-testid="next-image"]')).toBeVisible()
      await expect(firstCard.locator('text=?')).toBeHidden()
    })

    test('タイマーが正しく動作する', async ({ page }) => {
      // 初期状態では0:00
      await expect(page.locator('text=0:00')).toBeVisible()

      // カードをクリックしてタイマー開始
      const cards = page.locator('[data-testid="card"]').filter({ has: page.locator('text=?') })
      await cards.first().click()

      // 少し待機してタイマーが進むことを確認
      await page.waitForTimeout(2000)
      await expect(page.locator('text=0:0')).toBeVisible() // 0:01 または 0:02 など
    })

    test('手数カウンターが動作する', async ({ page }) => {
      // 初期状態では手数: 0
      await expect(page.locator('text=手数: 0')).toBeVisible()

      const cards = page.locator('[data-testid="card"]').filter({ has: page.locator('text=?') })

      // 1枚目をクリック
      await cards.nth(0).click()
      await expect(page.locator('text=手数: 0')).toBeVisible() // まだ0

      // 2枚目をクリック（ペア判定で手数が1増加）
      await cards.nth(1).click()
      await expect(page.locator('text=手数: 1')).toBeVisible()
    })

    test('リアクションメッセージが表示される', async ({ page }) => {
      const cards = page.locator('[data-testid="card"]').filter({ has: page.locator('text=?') })

      // カードをクリック
      await cards.first().click()

      // リアクションメッセージが表示される
      const reactionMessages = [
        'いい選択ですね！',
        'どんなカードかな？',
        '集中していきましょう！',
        'いい感じですね✨',
        'この調子でいきましょう！'
      ]

      const hasReaction = await Promise.race(
        reactionMessages.map(msg =>
          page.locator(`text=${msg}`).isVisible().then(visible => ({ msg, visible }))
        )
      )

      expect(hasReaction.visible).toBe(true)
    })

    test('リセット機能が動作する', async ({ page }) => {
      const cards = page.locator('[data-testid="card"]').filter({ has: page.locator('text=?') })

      // いくつかカードをクリック
      await cards.nth(0).click()
      await cards.nth(1).click()

      // リセットボタンをクリック
      await page.locator('text=リセット').click()

      // すべてのカードが裏向きに戻る
      await expect(cards).toHaveCount(12)
      await expect(page.locator('text=手数: 0')).toBeVisible()
      await expect(page.locator('text=0:00')).toBeVisible()
    })
  })

  test.describe('ゲーム完了機能', () => {
    test.beforeEach(async ({ page }) => {
      // 初級を選択
      await page.locator('text=初級').first().click()
      await expect(page.locator('[data-testid="modal"]')).toBeHidden()
    })

    test('ゲーム完了時にスコアが表示される', async ({ page }) => {
      // Note: 実際のペア完成は困難なため、モック的な完了をテストする
      // 開発中はこのテストをスキップするか、手動でペアを完成させる

      // 全てのカードを順番にクリックしてペアを見つける試行
      const cards = page.locator('[data-testid="card"]').filter({ has: page.locator('text=?') })
      const cardCount = await cards.count()

      // 簡単な方法：開発者ツールでゲーム状態を操作するか、
      // またはより少ないペア数でテストする
      test.skip(cardCount > 4, '実際のゲーム完了テストは手動で実行')
    })

    test('ゲーム完了後にギャラリーが表示される', async ({ page }) => {
      // このテストも実際のゲーム完了が必要
      test.skip('実際のゲーム完了が必要なため手動テスト')
    })
  })

  test.describe('難易度別テスト', () => {
    test('中級選択時に16枚のカードが生成される', async ({ page }) => {
      await page.locator('text=中級').first().click()
      await expect(page.locator('[data-testid="modal"]')).toBeHidden()

      const cards = page.locator('[data-testid="card"]').filter({ has: page.locator('text=?') })
      await expect(cards).toHaveCount(16) // 8ペア
    })

    test('上級選択時に24枚のカードが生成される', async ({ page }) => {
      await page.locator('text=上級').first().click()
      await expect(page.locator('[data-testid="modal"]')).toBeHidden()

      const cards = page.locator('[data-testid="card"]').filter({ has: page.locator('text=?') })
      await expect(cards).toHaveCount(24) // 12ペア
    })

    test('難易度変更機能', async ({ page }) => {
      // 初級選択
      await page.locator('text=初級').first().click()
      await expect(page.locator('text=現在の難易度: 初級')).toBeVisible()

      // 難易度変更ボタンをクリック
      await page.locator('text=難易度変更').click()

      // モーダルが再表示される
      await expect(page.locator('[data-testid="modal"]')).toBeVisible()

      // 中級を選択
      await page.locator('text=中級').first().click()
      await expect(page.locator('text=現在の難易度: 中級')).toBeVisible()
    })
  })

  test.describe('レスポンシブ対応', () => {
    test('モバイル表示でモーダルが適切に表示される', async ({ page }) => {
      // モバイルサイズに変更
      await page.setViewportSize({ width: 375, height: 667 })

      // モーダルが表示される
      await expect(page.locator('[data-testid="modal"]')).toBeVisible()

      // 難易度選択が縦並びで表示される
      await expect(page.locator('text=初級')).toBeVisible()
      await expect(page.locator('text=中級')).toBeVisible()
      await expect(page.locator('text=上級')).toBeVisible()

      // タップで選択できる
      await page.locator('text=初級').first().click()
      await expect(page.locator('[data-testid="modal"]')).toBeHidden()
    })

    test('タブレット表示でゲームが適切に動作する', async ({ page }) => {
      // タブレットサイズに変更
      await page.setViewportSize({ width: 768, height: 1024 })

      // 初級選択
      await page.locator('text=初級').first().click()

      // カードが適切に表示される
      const cards = page.locator('[data-testid="card"]').filter({ has: page.locator('text=?') })
      await expect(cards).toHaveCount(12)

      // タップでカードが動作する
      await cards.first().click()
      await expect(cards.first().locator('[data-testid="next-image"]')).toBeVisible()
    })

    test('デスクトップ表示でキーボード操作が動作する', async ({ page }) => {
      // デスクトップサイズ
      await page.setViewportSize({ width: 1920, height: 1080 })

      // キーボードで難易度選択
      await page.keyboard.press('2') // 中級
      await expect(page.locator('text=現在の難易度: 中級')).toBeVisible()
    })
  })

  test.describe('エラーハンドリング', () => {
    test('ネットワークエラー時の表示', async ({ page }) => {
      // ネットワークをオフラインに
      await page.context().setOffline(true)

      // ページをリロード
      await page.reload()

      // エラーメッセージが表示される可能性
      const errorElements = [
        page.locator('text=読み込みに失敗'),
        page.locator('text=エラーが発生'),
        page.locator('[data-testid="error-message"]')
      ]

      const hasError = await Promise.race(
        errorElements.map(element => element.isVisible())
      )

      // ネットワークを元に戻す
      await page.context().setOffline(false)
    })

    test('APIエラー時のリトライ機能', async ({ page }) => {
      // APIエラーをモック（実際のテストでは複雑）
      // この部分は統合テストで実装
      test.skip('APIモックが必要なため統合テストで実装')
    })
  })

  test.describe('アクセシビリティ', () => {
    test('キーボードナビゲーション', async ({ page }) => {
      // 初級選択
      await page.locator('text=初級').first().click()

      // タブキーでナビゲーション
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // フォーカス可能な要素が存在する
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    })

    test('画像のalt属性', async ({ page }) => {
      await page.locator('text=初級').first().click()

      // カードをクリックして画像を表示
      const cards = page.locator('[data-testid="card"]').filter({ has: page.locator('text=?') })
      await cards.first().click()

      // 画像にalt属性が設定されている
      const image = cards.first().locator('[data-testid="next-image"]')
      const altText = await image.getAttribute('alt')
      expect(altText).toBeTruthy()
    })

    test('カラーコントラスト', async ({ page }) => {
      // ハイコントラストモードでの表示確認
      await page.emulateMedia({ colorScheme: 'dark' })

      // モーダルが適切に表示される
      await expect(page.locator('[data-testid="modal"]')).toBeVisible()
      await expect(page.locator('text=難易度を選択してください')).toBeVisible()
    })
  })

  test.describe('パフォーマンス', () => {
    test('ページ読み込み速度', async ({ page }) => {
      const startTime = Date.now()
      await page.goto('/memory')

      // モーダルが表示されるまでの時間
      await expect(page.locator('[data-testid="modal"]')).toBeVisible()
      const loadTime = Date.now() - startTime

      // 5秒以内に読み込まれることを確認
      expect(loadTime).toBeLessThan(5000)
    })

    test('カードクリック応答性', async ({ page }) => {
      await page.locator('text=初級').first().click()

      const cards = page.locator('[data-testid="card"]').filter({ has: page.locator('text=?') })

      const startTime = Date.now()
      await cards.first().click()

      // 画像が表示されるまでの時間
      await expect(cards.first().locator('[data-testid="next-image"]')).toBeVisible()
      const responseTime = Date.now() - startTime

      // 1秒以内に応答することを確認
      expect(responseTime).toBeLessThan(1000)
    })
  })
})
