import { test, expect } from '@playwright/test';

test.describe('Reward Claiming', () => {
  test('should be able to claim daily reward when available', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const modal = page.locator('[data-testid="daily-rewards-modal"]');
    
    if (await modal.isVisible()) {
      const claimButton = page.locator('[data-testid="claim-reward-button"]');
      
      // Check if button is enabled (can claim)
      const isDisabled = await claimButton.isDisabled();
      
      if (!isDisabled) {
        // Click to claim
        await claimButton.click();
        
        // Wait for claim animation/response
        await page.waitForTimeout(2000);
        
        // After claiming, modal should close automatically
        await expect(modal).not.toBeVisible({ timeout: 5000 });
      } else {
        // Button shows "already claimed" state
        await expect(claimButton).toContainText(/Получено|завтра/);
      }
    }
  });

  test('should not show modal again after dismissing today', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const modal = page.locator('[data-testid="daily-rewards-modal"]');
    
    if (await modal.isVisible()) {
      // Close the modal
      await page.locator('[data-testid="close-daily-rewards"]').click();
      await expect(modal).not.toBeVisible();
      
      // Reload the page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Modal should not auto-open again
      await page.waitForTimeout(2000);
      await expect(modal).not.toBeVisible();
    }
  });
});
