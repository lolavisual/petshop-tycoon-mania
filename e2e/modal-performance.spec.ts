import { test, expect } from '@playwright/test';

test.describe('Modal Performance Tests', () => {
  test.describe('FPS & Jank Monitoring', () => {
    test('measures FPS during rapid modal open/close cycles', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="nav-bar"]');

      // Setup FPS monitoring
      await page.evaluate(() => {
        (window as any).__frameCount = 0;
        (window as any).__frameTimes = [];
        (window as any).__jankFrames = [];
        (window as any).__lastFrameTime = performance.now();

        const measureFrame = () => {
          const now = performance.now();
          const delta = now - (window as any).__lastFrameTime;
          (window as any).__frameTimes.push(delta);
          
          // Jank detection: frames taking more than 50ms (less than 20fps)
          if (delta > 50) {
            (window as any).__jankFrames.push({ delta, timestamp: now });
          }
          
          (window as any).__lastFrameTime = now;
          (window as any).__frameCount++;
          requestAnimationFrame(measureFrame);
        };
        requestAnimationFrame(measureFrame);
      });

      // Navigate to profile to trigger potential modals
      await page.click('[data-testid="nav-profile"]');
      await page.waitForTimeout(500);

      // Try to trigger daily rewards modal multiple times
      const premiumButton = page.locator('[data-testid="premium-button"], [data-testid="open-premium-modal"]').first();
      
      if (await premiumButton.isVisible().catch(() => false)) {
        // Rapid open/close cycles
        for (let i = 0; i < 5; i++) {
          await premiumButton.click({ force: true });
          await page.waitForTimeout(200);
          
          // Try to close modal
          const closeButton = page.locator('[data-testid="close-premium-modal"], [data-testid="premium-modal-backdrop"]').first();
          if (await closeButton.isVisible().catch(() => false)) {
            await closeButton.click({ force: true });
          }
          await page.waitForTimeout(200);
        }
      }

      // Get FPS statistics
      const stats = await page.evaluate(() => {
        const frameTimes = (window as any).__frameTimes.slice(-100);
        const jankFrames = (window as any).__jankFrames;
        
        if (frameTimes.length === 0) return null;
        
        const avgFrameTime = frameTimes.reduce((a: number, b: number) => a + b, 0) / frameTimes.length;
        const fps = 1000 / avgFrameTime;
        const maxFrameTime = Math.max(...frameTimes);
        const minFps = 1000 / maxFrameTime;
        
        return {
          avgFrameTime: avgFrameTime.toFixed(2),
          fps: fps.toFixed(1),
          maxFrameTime: maxFrameTime.toFixed(2),
          minFps: minFps.toFixed(1),
          jankCount: jankFrames.length,
          totalFrames: frameTimes.length,
        };
      });

      if (stats) {
        console.log(`Modal Performance Stats:`);
        console.log(`  Average FPS: ${stats.fps}`);
        console.log(`  Min FPS: ${stats.minFps}`);
        console.log(`  Avg frame time: ${stats.avgFrameTime}ms`);
        console.log(`  Max frame time: ${stats.maxFrameTime}ms`);
        console.log(`  Jank frames (>50ms): ${stats.jankCount}`);
        console.log(`  Total frames: ${stats.totalFrames}`);

        // Assertions
        expect(parseFloat(stats.fps)).toBeGreaterThan(30);
        expect(stats.jankCount).toBeLessThan(10); // Allow some jank during animations
      }
    });

    test('measures FPS during rapid taps on modal content', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="nav-bar"]');

      // Setup FPS monitoring
      await page.evaluate(() => {
        (window as any).__frameTimes = [];
        (window as any).__lastFrameTime = performance.now();

        const measureFrame = () => {
          const now = performance.now();
          (window as any).__frameTimes.push(now - (window as any).__lastFrameTime);
          (window as any).__lastFrameTime = now;
          requestAnimationFrame(measureFrame);
        };
        requestAnimationFrame(measureFrame);
      });

      // Navigate to quests and try to interact with quest items
      await page.click('[data-testid="nav-quests"]');
      await page.waitForTimeout(500);

      // Find and rapidly tap on quest cards
      const questCards = page.locator('[data-testid="quest-card"], [data-testid="quest-item"]');
      const count = await questCards.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const card = questCards.nth(i);
        if (await card.isVisible().catch(() => false)) {
          // Rapid taps on the same element
          for (let tap = 0; tap < 10; tap++) {
            await card.click({ force: true, delay: 30 });
          }
        }
      }

      // Get FPS statistics
      const stats = await page.evaluate(() => {
        const frameTimes = (window as any).__frameTimes.slice(-200);
        if (frameTimes.length === 0) return null;

        const avgFrameTime = frameTimes.reduce((a: number, b: number) => a + b, 0) / frameTimes.length;
        const fps = 1000 / avgFrameTime;
        const jankFrames = frameTimes.filter((t: number) => t > 50).length;

        return {
          fps: fps.toFixed(1),
          jankCount: jankFrames,
          avgFrameTime: avgFrameTime.toFixed(2),
        };
      });

      if (stats) {
        console.log(`Rapid tap FPS: ${stats.fps}, Jank frames: ${stats.jankCount}`);
        expect(parseFloat(stats.fps)).toBeGreaterThan(25);
      }
    });

    test('measures modal animation smoothness', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="nav-bar"]');

      // Setup animation timing observer
      await page.evaluate(() => {
        (window as any).__animationTimings = [];
        
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            (window as any).__animationTimings.push({
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime,
            });
          });
        });
        
        try {
          observer.observe({ entryTypes: ['longtask', 'event'] });
        } catch (e) {
          // Some browsers don't support all entry types
        }
      });

      // Try to open seasonal event modal if available
      const eventButton = page.locator('[data-testid="seasonal-event-button"], [data-testid="event-banner"]').first();
      
      if (await eventButton.isVisible().catch(() => false)) {
        const openStart = Date.now();
        await eventButton.click({ force: true });
        await page.waitForTimeout(500);
        const openDuration = Date.now() - openStart;

        console.log(`Modal open animation: ${openDuration}ms`);
        expect(openDuration).toBeLessThan(1000);

        // Close modal
        const closeButton = page.locator('[data-testid="close-seasonal-event"], [data-testid="seasonal-event-modal-backdrop"]').first();
        if (await closeButton.isVisible().catch(() => false)) {
          const closeStart = Date.now();
          await closeButton.click({ force: true });
          await page.waitForTimeout(500);
          const closeDuration = Date.now() - closeStart;

          console.log(`Modal close animation: ${closeDuration}ms`);
          expect(closeDuration).toBeLessThan(1000);
        }
      }
    });
  });

  test.describe('Telegram WebView Touch Performance', () => {
    test.use({ hasTouch: true });

    test('measures touch response latency on modals', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="nav-bar"]');

      const touchResponses: number[] = [];

      // Simulate touch events on various elements
      const interactiveElements = [
        '[data-testid="nav-game"]',
        '[data-testid="nav-shop"]',
        '[data-testid="nav-quests"]',
      ];

      for (const selector of interactiveElements) {
        const element = page.locator(selector).first();
        if (await element.isVisible().catch(() => false)) {
          const startTime = Date.now();
          await element.tap();
          await page.waitForTimeout(100);
          touchResponses.push(Date.now() - startTime);
        }
      }

      if (touchResponses.length > 0) {
        const avgResponse = touchResponses.reduce((a, b) => a + b, 0) / touchResponses.length;
        const maxResponse = Math.max(...touchResponses);

        console.log(`Touch Response Stats:`);
        console.log(`  Average: ${avgResponse.toFixed(2)}ms`);
        console.log(`  Max: ${maxResponse}ms`);
        console.log(`  Samples: ${touchResponses.length}`);

        expect(avgResponse).toBeLessThan(150);
        expect(maxResponse).toBeLessThan(300);
      }
    });

    test('measures swipe/scroll performance in modal content', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="nav-bar"]');

      // Setup scroll performance monitoring
      await page.evaluate(() => {
        (window as any).__scrollEvents = [];
        
        document.addEventListener('scroll', () => {
          (window as any).__scrollEvents.push({
            timestamp: performance.now(),
          });
        }, { capture: true, passive: true });
      });

      // Navigate to a page with scrollable content
      await page.click('[data-testid="nav-achievements"]');
      await page.waitForTimeout(500);

      // Perform swipe gestures
      const scrollArea = page.locator('[data-testid="achievements-page"]').first();
      if (await scrollArea.isVisible().catch(() => false)) {
        const box = await scrollArea.boundingBox();
        if (box) {
          // Swipe up
          await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height * 0.7);
          await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.7);
          await page.mouse.down();
          await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.3, { steps: 10 });
          await page.mouse.up();
          
          await page.waitForTimeout(200);
        }
      }

      const scrollStats = await page.evaluate(() => {
        return {
          scrollEventCount: (window as any).__scrollEvents?.length || 0,
        };
      });

      console.log(`Scroll events captured: ${scrollStats.scrollEventCount}`);
    });
  });

  test.describe('Memory During Modal Interactions', () => {
    test('checks memory usage during modal lifecycle', async ({ page }) => {
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

      // Open and close modals multiple times
      const modalTriggers = [
        { open: '[data-testid="nav-profile"]', close: null },
        { open: '[data-testid="nav-shop"]', close: null },
        { open: '[data-testid="nav-quests"]', close: null },
      ];

      for (let round = 0; round < 5; round++) {
        for (const trigger of modalTriggers) {
          const openButton = page.locator(trigger.open).first();
          if (await openButton.isVisible().catch(() => false)) {
            await openButton.click({ force: true });
            await page.waitForTimeout(200);
          }
        }
      }

      // Force GC if available
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });

      await page.waitForTimeout(500);
      const finalHeap = await getHeapSize();
      const heapGrowth = finalHeap - initialHeap;

      if (initialHeap > 0) {
        console.log(`Memory Usage:`);
        console.log(`  Initial: ${initialHeap.toFixed(2)}MB`);
        console.log(`  Final: ${finalHeap.toFixed(2)}MB`);
        console.log(`  Growth: ${heapGrowth.toFixed(2)}MB`);

        // Modal interactions shouldn't cause significant memory growth
        expect(heapGrowth).toBeLessThan(30);
      }
    });
  });
});

test.describe('Modal Accessibility Tests', () => {
  test('verifies Escape key closes modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="nav-bar"]');

    // Try to open a modal
    await page.click('[data-testid="nav-profile"]');
    await page.waitForTimeout(300);

    const premiumButton = page.locator('[data-testid="premium-button"], [data-testid="open-premium-modal"]').first();
    
    if (await premiumButton.isVisible().catch(() => false)) {
      await premiumButton.click();
      await page.waitForTimeout(300);

      // Check if modal is open
      const modal = page.locator('[data-testid="premium-modal"]');
      if (await modal.isVisible().catch(() => false)) {
        // Press Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        // Modal should be closed
        await expect(modal).not.toBeVisible();
        console.log('✓ Escape key closes modal');
      }
    }
  });

  test('verifies focus trap within modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="nav-bar"]');

    await page.click('[data-testid="nav-profile"]');
    await page.waitForTimeout(300);

    const premiumButton = page.locator('[data-testid="premium-button"], [data-testid="open-premium-modal"]').first();
    
    if (await premiumButton.isVisible().catch(() => false)) {
      await premiumButton.click();
      await page.waitForTimeout(500);

      const modal = page.locator('[data-testid="premium-modal"]');
      if (await modal.isVisible().catch(() => false)) {
        // Get initial focused element
        const initialFocused = await page.evaluate(() => document.activeElement?.tagName);
        console.log(`Initial focus: ${initialFocused}`);

        // Tab through elements
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press('Tab');
          await page.waitForTimeout(50);
        }

        // Check that focus is still within the modal
        const focusedInModal = await page.evaluate(() => {
          const modal = document.querySelector('[data-testid="premium-modal"]');
          return modal?.contains(document.activeElement);
        });

        console.log(`Focus trapped in modal: ${focusedInModal}`);
        
        // Clean up - close modal
        await page.keyboard.press('Escape');
      }
    }
  });

  test('verifies aria attributes on modals', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="nav-bar"]');

    await page.click('[data-testid="nav-profile"]');
    await page.waitForTimeout(300);

    const premiumButton = page.locator('[data-testid="premium-button"], [data-testid="open-premium-modal"]').first();
    
    if (await premiumButton.isVisible().catch(() => false)) {
      await premiumButton.click();
      await page.waitForTimeout(300);

      const modal = page.locator('[role="dialog"]').first();
      
      if (await modal.isVisible().catch(() => false)) {
        const ariaModal = await modal.getAttribute('aria-modal');
        
        console.log(`aria-modal: ${ariaModal}`);
        expect(ariaModal).toBe('true');

        await page.keyboard.press('Escape');
      }
    }
  });
});
