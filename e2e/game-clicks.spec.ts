import { test, expect } from '@playwright/test';

test.describe('Game Click Mechanics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Close any modals that might appear
    const closeButton = page.locator('[data-testid="close-daily-rewards"]');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  });

  test('should display game elements on main page', async ({ page }) => {
    // Check that the main game area is visible
    const gameArea = page.locator('.min-h-screen').first();
    await expect(gameArea).toBeVisible();
  });

  test('should have clickable pet area', async ({ page }) => {
    // Look for the tap zone or pet avatar
    const tapZone = page.locator('[class*="cursor-pointer"]').first();
    
    if (await tapZone.isVisible()) {
      // Perform a click
      await tapZone.click();
      
      // The click should register (no errors thrown)
      await expect(page).toHaveURL('/');
    }
  });

  test('should display crystals counter', async ({ page }) => {
    // Look for crystal/resource display
    const crystalDisplay = page.locator('text=/\\d+/').first();
    await expect(crystalDisplay).toBeVisible();
  });
});
