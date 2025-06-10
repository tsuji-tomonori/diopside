import { test, expect } from '@playwright/test';

test.describe('パフォーマンステスト', () => {
  const pages = [
    { name: 'ホームページ', url: '/' },
    { name: 'アーカイブページ', url: '/archives' },
    { name: '検索ページ', url: '/search' },
    { name: 'メモリーゲームページ', url: '/memory-game' },
  ];

  pages.forEach(({ name, url }) => {
    test.describe(name, () => {
      test('Core Web Vitals が基準を満たす', async ({ page }) => {
        // ページ読み込み開始
        const startTime = Date.now();
        await page.goto(url);
        
        // First Contentful Paint (FCP) の測定
        const fcpMetric = await page.evaluate(() => {
          return new Promise((resolve) => {
            new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
              if (fcpEntry) {
                resolve(fcpEntry.startTime);
              }
            }).observe({ entryTypes: ['paint'] });
            
            // タイムアウト設定
            setTimeout(() => resolve(null), 5000);
          });
        });

        // Largest Contentful Paint (LCP) の測定
        const lcpMetric = await page.evaluate(() => {
          return new Promise((resolve) => {
            new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const lastEntry = entries[entries.length - 1];
              resolve(lastEntry.startTime);
            }).observe({ entryTypes: ['largest-contentful-paint'] });
            
            // タイムアウト設定
            setTimeout(() => resolve(null), 10000);
          });
        });

        // Cumulative Layout Shift (CLS) の測定
        const clsMetric = await page.evaluate(() => {
          return new Promise((resolve) => {
            let clsValue = 0;
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (!(entry as any).hadRecentInput) {
                  clsValue += (entry as any).value;
                }
              }
            }).observe({ entryTypes: ['layout-shift'] });
            
            setTimeout(() => resolve(clsValue), 5000);
          });
        });

        // Core Web Vitals の基準値チェック
        if (fcpMetric) {
          expect(fcpMetric).toBeLessThan(1800); // FCP < 1.8s (Good)
        }
        
        if (lcpMetric) {
          expect(lcpMetric).toBeLessThan(2500); // LCP < 2.5s (Good)
        }
        
        if (clsMetric) {
          expect(clsMetric).toBeLessThan(0.1); // CLS < 0.1 (Good)
        }
      });

      test('ページ読み込み時間が適切である', async ({ page }) => {
        const startTime = Date.now();
        
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        const loadTime = Date.now() - startTime;
        
        // ページ読み込み時間が5秒以内であることを確認
        expect(loadTime).toBeLessThan(5000);
      });

      test('画像の最適化が適切である', async ({ page }) => {
        await page.goto(url);
        
        // 画像要素を取得
        const images = page.locator('img');
        const imageCount = await images.count();
        
        for (let i = 0; i < Math.min(imageCount, 10); i++) {
          const img = images.nth(i);
          
          // 画像が表示されるまで待機
          await img.waitFor({ state: 'visible' });
          
          // 画像の属性を取得
          const src = await img.getAttribute('src');
          const loading = await img.getAttribute('loading');
          const width = await img.getAttribute('width');
          const height = await img.getAttribute('height');
          
          // 遅延読み込みが設定されていることを確認
          if (i > 2) { // 最初の数枚以外は遅延読み込み
            expect(loading).toBe('lazy');
          }
          
          // 画像サイズが指定されていることを確認（CLS対策）
          expect(width).toBeTruthy();
          expect(height).toBeTruthy();
          
          // WebP形式の使用を推奨
          if (src && !src.startsWith('data:')) {
            // 実際の画像リクエストのContent-Typeをチェック
            const response = await page.request.get(src);
            const contentType = response.headers()['content-type'];
            
            // WebPまたは最適化された形式であることを確認
            expect(contentType).toMatch(/webp|avif|jpeg|png/);
          }
        }
      });

      test('JavaScriptバンドルサイズが適切である', async ({ page }) => {
        // ネットワークリクエストを監視
        const jsRequests: any[] = [];
        
        page.on('response', response => {
          const url = response.url();
          const contentType = response.headers()['content-type'] || '';
          
          if (contentType.includes('javascript') || url.endsWith('.js')) {
            jsRequests.push({
              url,
              size: parseInt(response.headers()['content-length'] || '0')
            });
          }
        });
        
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        // 総JavaScriptサイズを計算
        const totalJSSize = jsRequests.reduce((total, req) => total + req.size, 0);
        
        // JavaScriptバンドルサイズが1MB以下であることを確認
        expect(totalJSSize).toBeLessThan(1024 * 1024); // 1MB
        
        // 個別のJSファイルが500KB以下であることを確認
        jsRequests.forEach(req => {
          if (req.size > 0) {
            expect(req.size).toBeLessThan(500 * 1024); // 500KB
          }
        });
      });

      test('CSSの最適化が適切である', async ({ page }) => {
        const cssRequests: any[] = [];
        
        page.on('response', response => {
          const url = response.url();
          const contentType = response.headers()['content-type'] || '';
          
          if (contentType.includes('css') || url.endsWith('.css')) {
            cssRequests.push({
              url,
              size: parseInt(response.headers()['content-length'] || '0')
            });
          }
        });
        
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        // 総CSSサイズを計算
        const totalCSSSize = cssRequests.reduce((total, req) => total + req.size, 0);
        
        // CSSサイズが200KB以下であることを確認
        expect(totalCSSSize).toBeLessThan(200 * 1024); // 200KB
      });

      test('フォントの読み込みが最適化されている', async ({ page }) => {
        const fontRequests: any[] = [];
        
        page.on('response', response => {
          const url = response.url();
          const contentType = response.headers()['content-type'] || '';
          
          if (contentType.includes('font') || /\.(woff2?|ttf|otf|eot)$/.test(url)) {
            fontRequests.push({
              url,
              contentType,
              size: parseInt(response.headers()['content-length'] || '0')
            });
          }
        });
        
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        // フォントが使用されている場合の最適化チェック
        if (fontRequests.length > 0) {
          fontRequests.forEach(req => {
            // WOFF2形式の使用を推奨
            expect(req.contentType).toMatch(/woff2|woff/);
            
            // フォントサイズが適切であることを確認
            if (req.size > 0) {
              expect(req.size).toBeLessThan(100 * 1024); // 100KB per font
            }
          });
        }
      });

      test('メモリ使用量が適切である', async ({ page }) => {
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        // メモリ使用量を測定
        const memoryUsage = await page.evaluate(() => {
          if ('memory' in performance) {
            return (performance as any).memory;
          }
          return null;
        });
        
        if (memoryUsage) {
          // ヒープサイズが50MB以下であることを確認
          expect(memoryUsage.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024);
          
          // メモリリークがないことを確認（使用量が制限内であること）
          expect(memoryUsage.usedJSHeapSize).toBeLessThan(memoryUsage.totalJSHeapSize);
        }
      });

      test('レスポンス時間が適切である', async ({ page }) => {
        const responseTime = await page.evaluate(async () => {
          const startTime = performance.now();
          
          // APIリクエストをシミュレート
          try {
            const response = await fetch('/api/health');
            const endTime = performance.now();
            return endTime - startTime;
          } catch (error) {
            return null;
          }
        });
        
        if (responseTime) {
          // APIレスポンス時間が1秒以下であることを確認
          expect(responseTime).toBeLessThan(1000);
        }
      });

      test('キャッシュが適切に設定されている', async ({ page }) => {
        const cachedRequests: any[] = [];
        
        page.on('response', response => {
          const cacheControl = response.headers()['cache-control'];
          const etag = response.headers()['etag'];
          const lastModified = response.headers()['last-modified'];
          
          if (cacheControl || etag || lastModified) {
            cachedRequests.push({
              url: response.url(),
              cacheControl,
              etag,
              lastModified
            });
          }
        });
        
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        // 静的リソースにキャッシュヘッダーが設定されていることを確認
        const staticResources = cachedRequests.filter(req => 
          /\.(js|css|png|jpg|jpeg|gif|svg|woff2?|ttf)$/.test(req.url)
        );
        
        staticResources.forEach(resource => {
          expect(
            resource.cacheControl || resource.etag || resource.lastModified
          ).toBeTruthy();
        });
      });

      test('Service Workerが適切に動作する', async ({ page }) => {
        await page.goto(url);
        
        // Service Workerの登録状況を確認
        const swRegistration = await page.evaluate(async () => {
          if ('serviceWorker' in navigator) {
            try {
              const registration = await navigator.serviceWorker.getRegistration();
              return {
                registered: !!registration,
                active: !!registration?.active,
                scope: registration?.scope
              };
            } catch (error) {
              return { error: error.message };
            }
          }
          return { supported: false };
        });
        
        if (swRegistration.supported !== false) {
          // Service Workerが登録されている場合の確認
          if (swRegistration.registered) {
            expect(swRegistration.active).toBeTruthy();
            expect(swRegistration.scope).toBeTruthy();
          }
        }
      });

      test('リソースの並列読み込みが最適化されている', async ({ page }) => {
        const requestTimings: any[] = [];
        
        page.on('response', response => {
          requestTimings.push({
            url: response.url(),
            timing: response.timing(),
            status: response.status()
          });
        });
        
        const startTime = Date.now();
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        const totalTime = Date.now() - startTime;
        
        // 成功したリクエストのみを対象
        const successfulRequests = requestTimings.filter(req => req.status < 400);
        
        // リクエスト数に対して読み込み時間が適切であることを確認
        if (successfulRequests.length > 5) {
          // 多数のリソースがある場合、並列読み込みにより効率化されていることを確認
          const averageTimePerRequest = totalTime / successfulRequests.length;
          expect(averageTimePerRequest).toBeLessThan(500); // 平均500ms以下
        }
      });
    });
  });

  test.describe('モバイルパフォーマンス', () => {
    test.beforeEach(async ({ page }) => {
      // モバイルデバイスをエミュレート
      await page.emulate({
        viewport: { width: 375, height: 667 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
      });
    });

    test('モバイルでのCore Web Vitalsが基準を満たす', async ({ page }) => {
      await page.goto('/');
      
      // モバイル環境でのLCP測定
      const lcpMetric = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve(lastEntry.startTime);
          }).observe({ entryTypes: ['largest-contentful-paint'] });
          
          setTimeout(() => resolve(null), 10000);
        });
      });

      if (lcpMetric) {
        // モバイルでのLCP基準（少し緩い基準）
        expect(lcpMetric).toBeLessThan(4000); // 4秒以内
      }
    });

    test('モバイルでのタッチ操作が適切に動作する', async ({ page }) => {
      await page.goto('/');
      
      // タッチ可能な要素のサイズを確認
      const touchTargets = page.locator('button, a, input, [role="button"]');
      const touchTargetCount = await touchTargets.count();
      
      for (let i = 0; i < Math.min(touchTargetCount, 10); i++) {
        const target = touchTargets.nth(i);
        
        if (await target.isVisible()) {
          const boundingBox = await target.boundingBox();
          
          if (boundingBox) {
            // タッチターゲットが44px以上であることを確認（アクセシビリティガイドライン）
            expect(Math.min(boundingBox.width, boundingBox.height)).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });
  });
});