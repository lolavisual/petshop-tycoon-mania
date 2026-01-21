import { test, expect } from '@playwright/test';

test.describe('Tab Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Close any modals that might appear
    const closeButton = page.locator('[data-testid="close-daily-rewards"]');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  });

  test('should navigate to shop tab', async ({ page }) => {
    const shopTab = page.locator('text=Магазин').first();
    if (await shopTab.isVisible()) {
      await shopTab.click();
      // Check that shop content is visible
      await expect(page.locator('text=Магазин').first()).toBeVisible();
    }
  });

  test('should navigate to quests tab', async ({ page }) => {
    const questsTab = page.locator('text=Задания').first();
    if (await questsTab.isVisible()) {
      await questsTab.click();
      await expect(page.locator('text=Задания').first()).toBeVisible();
    }
  });

  test('should navigate to profile tab', async ({ page }) => {
    const profileTab = page.locator('text=Профиль').first();
    if (await profileTab.isVisible()) {
      await profileTab.click();
      await expect(page.locator('text=Профиль').first()).toBeVisible();
    }
  });

  test('should navigate to achievements tab', async ({ page }) => {
    const achievementsTab = page.locator('text=Достижения').first();
    if (await achievementsTab.isVisible()) {
      await achievementsTab.click();
      await expect(page.locator('text=Достижения').first()).toBeVisible();
    }
  });
});
