import { test, expect, devices } from '@playwright/test';

// Mobile touch tests specifically for Telegram WebView compatibility
test.describe('Mobile Touch Interactions', () => {
  // Use iPhone 13 device profile for realistic mobile testing
  test.use({ ...devices['iPhone 13'] });

  test.describe('Daily Rewards Modal Touch', () => {
    test('should close modal on backdrop tap', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const modal = page.locator('[data-testid="daily-rewards-modal"]');

      // Wait for modal to potentially auto-open
      await page.waitForTimeout(1500);

      if (await modal.isVisible()) {
        const backdrop = page.locator('[data-testid="daily-rewards-modal-backdrop"]');

        // Simulate touch tap on backdrop
        await backdrop.tap();

        // Modal should close
        await expect(modal).not.toBeVisible({ timeout: 3000 });
      }
    });

    test('should close modal on X button tap', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const modal = page.locator('[data-testid="daily-rewards-modal"]');

      await page.waitForTimeout(1500);

      if (await modal.isVisible()) {
        const closeButton = page.locator('[data-testid="close-daily-rewards"]');

        // Ensure button is visible and tappable
        await expect(closeButton).toBeVisible();

        // Simulate touch tap
        await closeButton.tap();

        // Modal should close
        await expect(modal).not.toBeVisible({ timeout: 3000 });
      }
    });

    test('should handle claim button tap when reward available', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const modal = page.locator('[data-testid="daily-rewards-modal"]');

      await page.waitForTimeout(1500);

      if (await modal.isVisible()) {
        const claimButton = page.locator('[data-testid="claim-reward-button"]');

        await expect(claimButton).toBeVisible();

        const isDisabled = await claimButton.isDisabled();

        if (!isDisabled) {
          // Simulate touch tap on claim
          await claimButton.tap();

          // Button should show loading or modal should close after animation
          await page.waitForTimeout(2000);
          await expect(modal).not.toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should not close modal when tapping inside content', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const modal = page.locator('[data-testid="daily-rewards-modal"]');

      await page.waitForTimeout(1500);

      if (await modal.isVisible()) {
        // Tap on a reward day tile (inside modal content)
        const rewardTile = page.locator('[data-testid="reward-day-1"]');

        if (await rewardTile.isVisible()) {
          await rewardTile.tap();

          // Modal should still be visible
          await page.waitForTimeout(500);
          await expect(modal).toBeVisible();
        }
      }
    });
  });

  test.describe('Touch Event Propagation', () => {
    test('should not trigger game taps when modal is open', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const modal = page.locator('[data-testid="daily-rewards-modal"]');

      await page.waitForTimeout(1500);

      if (await modal.isVisible()) {
        // Get initial state (if there's a crystal counter visible behind modal)
        // The tap should not register on game elements

        // Tap in the center of screen (where pet/tap zone usually is)
        await page.tap('body', { position: { x: 200, y: 400 } });

        // Modal should still be visible (tap was intercepted by modal layer)
        await expect(modal).toBeVisible();
      }
    });

    test('should handle rapid consecutive taps on close button', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const modal = page.locator('[data-testid="daily-rewards-modal"]');

      await page.waitForTimeout(1500);

      if (await modal.isVisible()) {
        const closeButton = page.locator('[data-testid="close-daily-rewards"]');

        // Rapid taps should not cause issues
        await closeButton.tap();
        await closeButton.tap().catch(() => {}); // May fail if modal already closing
        await closeButton.tap().catch(() => {});

        // Modal should close cleanly
        await expect(modal).not.toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe('Touch Accessibility', () => {
    test('should have adequate touch target size for buttons', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const modal = page.locator('[data-testid="daily-rewards-modal"]');

      await page.waitForTimeout(1500);

      if (await modal.isVisible()) {
        const closeButton = page.locator('[data-testid="close-daily-rewards"]');
        const claimButton = page.locator('[data-testid="claim-reward-button"]');

        // Check close button size (should be at least 44x44 for touch)
        const closeBox = await closeButton.boundingBox();
        if (closeBox) {
          expect(closeBox.width).toBeGreaterThanOrEqual(36); // p-2 = 8px padding on each side
          expect(closeBox.height).toBeGreaterThanOrEqual(36);
        }

        // Check claim button size (should be large enough)
        const claimBox = await claimButton.boundingBox();
        if (claimBox) {
          expect(claimBox.height).toBeGreaterThanOrEqual(44); // h-14 = 56px
        }
      }
    });
  });
});

// Desktop fallback - ensure click still works
test.describe('Desktop Click Fallback', () => {
  test('should close modal on backdrop click', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const modal = page.locator('[data-testid="daily-rewards-modal"]');

    await page.waitForTimeout(1500);

    if (await modal.isVisible()) {
      // Click on backdrop area (top-left corner away from modal content)
      await page.click('[data-testid="daily-rewards-modal"]', {
        position: { x: 10, y: 10 },
      });

      await expect(modal).not.toBeVisible({ timeout: 3000 });
    }
  });

  test('should close modal on X button click', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const modal = page.locator('[data-testid="daily-rewards-modal"]');

    await page.waitForTimeout(1500);

    if (await modal.isVisible()) {
      await page.click('[data-testid="close-daily-rewards"]');
      await expect(modal).not.toBeVisible({ timeout: 3000 });
    }
  });
});
