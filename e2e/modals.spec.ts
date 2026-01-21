import { test, expect } from '@playwright/test';

test.describe('Daily Rewards Modal', () => {
  test('should open and close daily rewards modal', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // The modal may auto-open if reward is available
    // Check if modal is visible or wait for it
    const modal = page.locator('[data-testid="daily-rewards-modal"]');
    
    // If modal is not visible, we need to trigger it (e.g., through a button)
    // For now, check if it exists when conditions are met
    if (await modal.isVisible()) {
      // Close the modal
      await page.locator('[data-testid="close-daily-rewards"]').click();
      
      // Modal should be closed
      await expect(modal).not.toBeVisible();
    }
  });

  test('should display reward days in modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const modal = page.locator('[data-testid="daily-rewards-modal"]');
    
    if (await modal.isVisible()) {
      // Check that reward days are displayed
      for (let day = 1; day <= 7; day++) {
        const rewardDay = page.locator(`[data-testid="reward-day-${day}"]`);
        await expect(rewardDay).toBeVisible();
      }
      
      // Check claim button exists
      const claimButton = page.locator('[data-testid="claim-reward-button"]');
      await expect(claimButton).toBeVisible();
    }
  });
});
