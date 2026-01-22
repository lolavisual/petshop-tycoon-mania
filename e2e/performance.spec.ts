import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test.describe('Page Load Performance', () => {
    test('measures initial page load time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      const domContentLoadedTime = Date.now() - startTime;
      
      await page.waitForLoadState('load');
      const fullLoadTime = Date.now() - startTime;
      
      // Wait for interactive state
      await page.waitForSelector('[data-testid="nav-bar"]', { timeout: 10000 });
      const interactiveTime = Date.now() - startTime;
      
      console.log(`DOM Content Loaded: ${domContentLoadedTime}ms`);
      console.log(`Full Load: ${fullLoadTime}ms`);
      console.log(`Interactive: ${interactiveTime}ms`);
      
      // Performance assertions
      expect(domContentLoadedTime).toBeLessThan(3000); // 3s max for DOM
      expect(fullLoadTime).toBeLessThan(5000); // 5s max for full load
      expect(interactiveTime).toBeLessThan(6000); // 6s max for interactive
    });

    test('measures Largest Contentful Paint (LCP)', async ({ page }) => {
      // Enable performance metrics
      const client = await page.context().newCDPSession(page);
      await client.send('Performance.enable');
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Get performance metrics
      const metrics = await client.send('Performance.getMetrics');
      const lcpMetric = metrics.metrics.find((m: any) => m.name === 'LargestContentfulPaint');
      
      if (lcpMetric) {
        console.log(`LCP: ${lcpMetric.value}ms`);
        expect(lcpMetric.value).toBeLessThan(2500); // Good LCP is under 2.5s
      }
    });

    test('measures navigation between tabs', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="nav-bar"]');
      
      const tabs = ['shop', 'quests', 'achievements', 'profile', 'game'];
      const navigationTimes: Record<string, number> = {};
      
      for (const tab of tabs) {
        const startTime = Date.now();
        await page.click(`[data-testid="nav-${tab}"]`);
        
        // Wait for tab content to be visible
        await page.waitForSelector(`[data-testid="${tab}-page"]`, { timeout: 5000 }).catch(() => {
          // Some pages might not have specific testid
        });
        
        navigationTimes[tab] = Date.now() - startTime;
        console.log(`Navigation to ${tab}: ${navigationTimes[tab]}ms`);
      }
      
      // All navigations should be under 500ms
      Object.values(navigationTimes).forEach(time => {
        expect(time).toBeLessThan(500);
      });
    });
  });

  test.describe('Click Performance & FPS', () => {
    test('measures FPS during rapid clicking', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="game-page"]');
      
      // Enable performance observer
      await page.evaluate(() => {
        (window as any).__frameCount = 0;
        (window as any).__lastFrameTime = performance.now();
        (window as any).__frameTimes = [];
        
        const measureFrame = () => {
          const now = performance.now();
          (window as any).__frameTimes.push(now - (window as any).__lastFrameTime);
          (window as any).__lastFrameTime = now;
          (window as any).__frameCount++;
          requestAnimationFrame(measureFrame);
        };
        requestAnimationFrame(measureFrame);
      });
      
      // Find clickable area
      const tapArea = page.locator('[data-testid="tap-zone"], [data-testid="chaotic-pets"]').first();
      
      // Perform rapid clicks
      const clickStartTime = Date.now();
      for (let i = 0; i < 50; i++) {
        await tapArea.click({ force: true, delay: 20 });
      }
      const clickDuration = Date.now() - clickStartTime;
      
      // Get frame statistics
      const stats = await page.evaluate(() => {
        const frameTimes = (window as any).__frameTimes.slice(-100);
        const avgFrameTime = frameTimes.reduce((a: number, b: number) => a + b, 0) / frameTimes.length;
        const fps = 1000 / avgFrameTime;
        return { avgFrameTime, fps, frameCount: frameTimes.length };
      });
      
      console.log(`Average frame time: ${stats.avgFrameTime.toFixed(2)}ms`);
      console.log(`Estimated FPS: ${stats.fps.toFixed(1)}`);
      console.log(`Click duration for 50 clicks: ${clickDuration}ms`);
      
      // FPS should be at least 30 during interactions
      expect(stats.fps).toBeGreaterThan(30);
    });

    test('measures click response time', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="game-page"]');
      
      const tapArea = page.locator('[data-testid="tap-zone"], [data-testid="chaotic-pets"]').first();
      
      const responseTimes: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        await tapArea.click({ force: true });
        
        // Wait for visual feedback (crystals counter update or animation)
        await page.waitForTimeout(50);
        responseTimes.push(Date.now() - startTime);
      }
      
      const avgResponseTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      
      console.log(`Average click response: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`Max click response: ${maxResponseTime}ms`);
      
      // Click response should be under 100ms for good UX
      expect(avgResponseTime).toBeLessThan(100);
      expect(maxResponseTime).toBeLessThan(200);
    });

    test('measures combo animation performance', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="game-page"]');
      
      const tapArea = page.locator('[data-testid="tap-zone"], [data-testid="chaotic-pets"]').first();
      
      // Enable animation timing
      await page.evaluate(() => {
        (window as any).__animationStart = performance.now();
        (window as any).__animationFrames = [];
      });
      
      // Rapid clicks to trigger combo
      for (let i = 0; i < 20; i++) {
        await tapArea.click({ force: true, delay: 50 });
      }
      
      // Check for combo indicator
      const comboVisible = await page.locator('[data-testid="combo-indicator"]').isVisible().catch(() => false);
      
      console.log(`Combo indicator visible after 20 clicks: ${comboVisible}`);
    });
  });

  test.describe('API Response Time', () => {
    test('measures API call duration for game click', async ({ page }) => {
      const apiCalls: { url: string; duration: number; status: number }[] = [];
      
      page.on('response', async (response) => {
        const timing = response.request().timing();
        if (response.url().includes('functions') || response.url().includes('supabase')) {
          apiCalls.push({
            url: response.url(),
            duration: timing.responseEnd - timing.requestStart,
            status: response.status()
          });
        }
      });
      
      await page.goto('/');
      await page.waitForSelector('[data-testid="game-page"]');
      
      const tapArea = page.locator('[data-testid="tap-zone"], [data-testid="chaotic-pets"]').first();
      
      // Make a click to trigger API call
      await tapArea.click({ force: true });
      await page.waitForTimeout(1000);
      
      console.log('API Calls:', JSON.stringify(apiCalls, null, 2));
      
      // Check all API calls completed successfully
      apiCalls.forEach(call => {
        expect(call.status).toBeLessThan(400);
      });
    });

    test('measures quest claim API response', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="nav-bar"]');
      
      // Navigate to quests
      await page.click('[data-testid="nav-quests"]');
      await page.waitForSelector('[data-testid="quests-page"]');
      
      // Track API responses
      let claimApiDuration = 0;
      
      page.on('response', async (response) => {
        if (response.url().includes('quest-claim')) {
          const timing = response.request().timing();
          claimApiDuration = timing.responseEnd - timing.requestStart;
        }
      });
      
      // Look for claimable quest
      const claimButton = page.locator('[data-testid="quest-claim-button"]').first();
      if (await claimButton.isVisible()) {
        await claimButton.click();
        await page.waitForTimeout(2000);
        
        console.log(`Quest claim API duration: ${claimApiDuration}ms`);
        
        if (claimApiDuration > 0) {
          expect(claimApiDuration).toBeLessThan(3000);
        }
      }
    });

    test('measures profile data load time', async ({ page }) => {
      const dataLoadStart = Date.now();
      
      await page.goto('/');
      await page.waitForSelector('[data-testid="nav-bar"]');
      
      // Navigate to profile
      await page.click('[data-testid="nav-profile"]');
      
      // Wait for profile data
      await page.waitForSelector('[data-testid="profile-page"]');
      await page.waitForSelector('[data-testid="profile-stats"]', { timeout: 5000 }).catch(() => {});
      
      const dataLoadTime = Date.now() - dataLoadStart;
      
      console.log(`Profile data load time: ${dataLoadTime}ms`);
      expect(dataLoadTime).toBeLessThan(3000);
    });
  });

  test.describe('Memory & Resource Usage', () => {
    test('checks for memory leaks during navigation', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="nav-bar"]');
      
      const getHeapSize = async () => {
        return await page.evaluate(() => {
          if ((performance as any).memory) {
            return (performance as any).memory.usedJSHeapSize / 1024 / 1024;
          }
          return 0;
        });
      };
      
      const initialHeap = await getHeapSize();
      
      // Navigate through all tabs multiple times
      for (let round = 0; round < 3; round++) {
        await page.click('[data-testid="nav-shop"]');
        await page.waitForTimeout(300);
        await page.click('[data-testid="nav-quests"]');
        await page.waitForTimeout(300);
        await page.click('[data-testid="nav-achievements"]');
        await page.waitForTimeout(300);
        await page.click('[data-testid="nav-profile"]');
        await page.waitForTimeout(300);
        await page.click('[data-testid="nav-game"]');
        await page.waitForTimeout(300);
      }
      
      // Force garbage collection if possible
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });
      
      const finalHeap = await getHeapSize();
      const heapGrowth = finalHeap - initialHeap;
      
      console.log(`Initial heap: ${initialHeap.toFixed(2)}MB`);
      console.log(`Final heap: ${finalHeap.toFixed(2)}MB`);
      console.log(`Heap growth: ${heapGrowth.toFixed(2)}MB`);
      
      // Memory growth should be reasonable (less than 50MB)
      if (initialHeap > 0) {
        expect(heapGrowth).toBeLessThan(50);
      }
    });

    test('measures bundle size impact', async ({ page }) => {
      const resources: { url: string; size: number; type: string }[] = [];
      
      page.on('response', async (response) => {
        const headers = response.headers();
        const contentLength = headers['content-length'];
        const contentType = headers['content-type'] || 'unknown';
        
        if (contentLength && (contentType.includes('javascript') || contentType.includes('css'))) {
          resources.push({
            url: response.url(),
            size: parseInt(contentLength) / 1024,
            type: contentType.includes('javascript') ? 'JS' : 'CSS'
          });
        }
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const totalJS = resources.filter(r => r.type === 'JS').reduce((sum, r) => sum + r.size, 0);
      const totalCSS = resources.filter(r => r.type === 'CSS').reduce((sum, r) => sum + r.size, 0);
      
      console.log(`Total JS: ${totalJS.toFixed(2)}KB`);
      console.log(`Total CSS: ${totalCSS.toFixed(2)}KB`);
      console.log(`Total bundle: ${(totalJS + totalCSS).toFixed(2)}KB`);
      
      // Bundle should be under 1MB (compressed)
      expect(totalJS + totalCSS).toBeLessThan(1024);
    });
  });
});
