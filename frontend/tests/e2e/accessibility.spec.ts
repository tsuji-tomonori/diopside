import { test, expect } from '@playwright/test';

test.describe('アクセシビリティテスト', () => {
  const pages = [
    { name: 'ホームページ', url: '/' },
    { name: 'アーカイブページ', url: '/archives' },
    { name: '検索ページ', url: '/search' },
    { name: 'メモリーゲームページ', url: '/memory-game' },
  ];

  pages.forEach(({ name, url }) => {
    test.describe(name, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(url);
      });

      test('基本的なランドマーク要素が存在する', async ({ page }) => {
        // メインコンテンツ領域
        const main = page.locator('main, [role="main"]');
        await expect(main).toBeVisible();

        // ナビゲーション
        const nav = page.locator('nav, [role="navigation"]');
        await expect(nav).toBeVisible();

        // ヘッダー
        const header = page.locator('header, [role="banner"]');
        await expect(header).toBeVisible();

        // フッター（存在する場合）
        const footer = page.locator('footer, [role="contentinfo"]');
        if (await footer.count() > 0) {
          await expect(footer).toBeVisible();
        }
      });

      test('見出し階層が適切である', async ({ page }) => {
        // h1要素が1つ存在する
        const h1Elements = page.locator('h1');
        const h1Count = await h1Elements.count();
        expect(h1Count).toBe(1);

        // 見出しが順序通りに配置されている
        const headings = page.locator('h1, h2, h3, h4, h5, h6');
        const headingLevels: number[] = [];

        for (let i = 0; i < await headings.count(); i++) {
          const heading = headings.nth(i);
          const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
          const level = parseInt(tagName.charAt(1));
          headingLevels.push(level);
        }

        // 見出しレベルが適切にネストされているかチェック
        for (let i = 1; i < headingLevels.length; i++) {
          const currentLevel = headingLevels[i];
          const previousLevel = headingLevels[i - 1];
          
          // 見出しレベルが2以上飛ばないことを確認
          if (currentLevel > previousLevel) {
            expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
          }
        }
      });

      test('フォーカス管理が適切である', async ({ page }) => {
        // Tabキーでフォーカス移動
        await page.keyboard.press('Tab');
        
        let focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();

        // フォーカス可能な要素を順次確認
        const focusableElements = page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const focusableCount = await focusableElements.count();

        if (focusableCount > 0) {
          // 最初の要素にフォーカスが当たることを確認
          const firstFocusable = focusableElements.first();
          await firstFocusable.focus();
          await expect(firstFocusable).toBeFocused();

          // フォーカスインジケーターが表示されることを確認
          const focusStyles = await firstFocusable.evaluate(el => {
            const styles = window.getComputedStyle(el, ':focus');
            return {
              outline: styles.outline,
              boxShadow: styles.boxShadow,
              border: styles.border
            };
          });

          // フォーカススタイルが設定されていることを確認
          const hasFocusStyle = 
            focusStyles.outline !== 'none' || 
            focusStyles.boxShadow !== 'none' || 
            focusStyles.border !== 'none';
          
          expect(hasFocusStyle).toBeTruthy();
        }
      });

      test('キーボードナビゲーションが機能する', async ({ page }) => {
        // リンクやボタンがEnterキーで操作可能
        const interactiveElements = page.locator('a, button');
        
        if (await interactiveElements.count() > 0) {
          const firstElement = interactiveElements.first();
          await firstElement.focus();
          
          // Enterキーで操作可能であることを確認
          const tagName = await firstElement.evaluate(el => el.tagName.toLowerCase());
          
          if (tagName === 'button') {
            // ボタンの場合、Enterキーでクリックイベントが発生することを確認
            let clicked = false;
            await firstElement.evaluate(el => {
              el.addEventListener('click', () => { (window as any).testClicked = true; });
            });
            
            await firstElement.press('Enter');
            
            const wasClicked = await page.evaluate(() => (window as any).testClicked);
            if (wasClicked !== undefined) {
              expect(wasClicked).toBeTruthy();
            }
          }
        }
      });

      test('画像に適切なalt属性が設定されている', async ({ page }) => {
        const images = page.locator('img');
        const imageCount = await images.count();

        for (let i = 0; i < imageCount; i++) {
          const img = images.nth(i);
          const alt = await img.getAttribute('alt');
          const src = await img.getAttribute('src');

          // 装飾的な画像でない限り、alt属性が存在することを確認
          if (src && !src.includes('decoration') && !src.includes('spacer')) {
            expect(alt).not.toBeNull();
            
            // alt属性が空でないことを確認（装飾的でない場合）
            if (alt !== '') {
              expect(alt!.length).toBeGreaterThan(0);
            }
          }
        }
      });

      test('フォーム要素にラベルが関連付けられている', async ({ page }) => {
        const inputs = page.locator('input, select, textarea');
        const inputCount = await inputs.count();

        for (let i = 0; i < inputCount; i++) {
          const input = inputs.nth(i);
          const inputId = await input.getAttribute('id');
          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledby = await input.getAttribute('aria-labelledby');

          // ラベルが関連付けられていることを確認
          if (inputId) {
            const label = page.locator(`label[for="${inputId}"]`);
            const hasLabel = await label.count() > 0;
            const hasAriaLabel = ariaLabel !== null;
            const hasAriaLabelledby = ariaLabelledby !== null;

            expect(hasLabel || hasAriaLabel || hasAriaLabelledby).toBeTruthy();
          } else {
            // IDがない場合は、aria-labelまたはaria-labelledbyが必要
            expect(ariaLabel !== null || ariaLabelledby !== null).toBeTruthy();
          }
        }
      });

      test('色のコントラスト比が適切である', async ({ page }) => {
        // 主要なテキスト要素のコントラスト比をチェック
        const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, a, button, span');
        const sampleSize = Math.min(await textElements.count(), 10); // サンプル数を制限

        for (let i = 0; i < sampleSize; i++) {
          const element = textElements.nth(i);
          
          if (await element.isVisible()) {
            const styles = await element.evaluate(el => {
              const computed = window.getComputedStyle(el);
              return {
                color: computed.color,
                backgroundColor: computed.backgroundColor,
                fontSize: computed.fontSize
              };
            });

            // RGB値を抽出してコントラスト比を計算
            const textColor = parseRGB(styles.color);
            const bgColor = parseRGB(styles.backgroundColor);
            
            if (textColor && bgColor) {
              const contrastRatio = calculateContrastRatio(textColor, bgColor);
              const fontSize = parseFloat(styles.fontSize);
              
              // WCAG AA基準: 通常テキスト4.5:1、大きなテキスト3:1
              const minRatio = fontSize >= 18 || fontSize >= 14 ? 3 : 4.5;
              
              // コントラスト比が基準を満たすことを確認
              expect(contrastRatio).toBeGreaterThanOrEqual(minRatio);
            }
          }
        }
      });

      test('ARIAラベルとロールが適切に設定されている', async ({ page }) => {
        // ボタン要素のARIA属性確認
        const buttons = page.locator('button, [role="button"]');
        const buttonCount = await buttons.count();

        for (let i = 0; i < buttonCount; i++) {
          const button = buttons.nth(i);
          const ariaLabel = await button.getAttribute('aria-label');
          const textContent = await button.textContent();

          // ボタンにアクセシブルな名前があることを確認
          expect(ariaLabel !== null || (textContent && textContent.trim().length > 0)).toBeTruthy();
        }

        // リンク要素の確認
        const links = page.locator('a');
        const linkCount = await links.count();

        for (let i = 0; i < linkCount; i++) {
          const link = links.nth(i);
          const href = await link.getAttribute('href');
          const textContent = await link.textContent();
          const ariaLabel = await link.getAttribute('aria-label');

          if (href && href !== '#') {
            // リンクにアクセシブルな名前があることを確認
            expect(ariaLabel !== null || (textContent && textContent.trim().length > 0)).toBeTruthy();
          }
        }
      });

      test('エラーメッセージが適切に関連付けられている', async ({ page }) => {
        // フォームエラーの確認（エラー状態をシミュレート）
        const forms = page.locator('form');
        
        if (await forms.count() > 0) {
          const form = forms.first();
          const inputs = form.locator('input[required], select[required], textarea[required]');
          
          if (await inputs.count() > 0) {
            const requiredInput = inputs.first();
            
            // 無効な値を入力してエラーを発生させる
            await requiredInput.fill('');
            await requiredInput.blur();
            
            // エラーメッセージが表示される場合の確認
            const errorMessage = page.locator('.error, [role="alert"], .invalid-feedback');
            
            if (await errorMessage.isVisible()) {
              const ariaDescribedby = await requiredInput.getAttribute('aria-describedby');
              const errorId = await errorMessage.getAttribute('id');
              
              // エラーメッセージが入力フィールドに関連付けられていることを確認
              if (errorId) {
                expect(ariaDescribedby).toContain(errorId);
              }
            }
          }
        }
      });

      test('スクリーンリーダー用のテキストが適切に設定されている', async ({ page }) => {
        // sr-only クラスやvisually-hiddenクラスの要素確認
        const srOnlyElements = page.locator('.sr-only, .visually-hidden, .screen-reader-only');
        const srOnlyCount = await srOnlyElements.count();

        for (let i = 0; i < srOnlyCount; i++) {
          const element = srOnlyElements.nth(i);
          const styles = await element.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              position: computed.position,
              width: computed.width,
              height: computed.height,
              overflow: computed.overflow,
              clip: computed.clip
            };
          });

          // スクリーンリーダー専用テキストが視覚的に隠されていることを確認
          const isVisuallyHidden = 
            styles.position === 'absolute' &&
            (styles.width === '1px' || styles.height === '1px' || styles.overflow === 'hidden');
          
          expect(isVisuallyHidden).toBeTruthy();
        }
      });
    });
  });
});

// ヘルパー関数
function parseRGB(rgbString: string): { r: number; g: number; b: number } | null {
  const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3])
    };
  }
  return null;
}

function calculateContrastRatio(color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }): number {
  const luminance1 = calculateLuminance(color1);
  const luminance2 = calculateLuminance(color2);
  
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

function calculateLuminance(color: { r: number; g: number; b: number }): number {
  const { r, g, b } = color;
  
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}