import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.describe('Main Game Page', () => {
    test('should match main game screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Wait for animations to settle
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('main-game.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match pet area screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const petArea = page.locator('[data-testid="pet-area"]').first();
      if (await petArea.isVisible()) {
        await expect(petArea).toHaveScreenshot('pet-area.png', {
          animations: 'disabled',
        });
      }
    });

    test('should match header with resources screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Capture header area with crystals/diamonds counters
      const header = page.locator('header').first();
      if (await header.isVisible()) {
        await expect(header).toHaveScreenshot('header-resources.png', {
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Shop Page', () => {
    test('should match shop page screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Navigate to shop
      const shopTab = page.getByText('Магазин').or(page.getByText('Shop'));
      if (await shopTab.isVisible()) {
        await shopTab.click();
        await page.waitForTimeout(500);
        
        await expect(page).toHaveScreenshot('shop-page.png', {
          fullPage: true,
          animations: 'disabled',
        });
      }
    });

    test('should match shop items grid screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const shopTab = page.getByText('Магазин').or(page.getByText('Shop'));
      if (await shopTab.isVisible()) {
        await shopTab.click();
        await page.waitForTimeout(500);
        
        const itemsGrid = page.locator('[data-testid="shop-items"]').first();
        if (await itemsGrid.isVisible()) {
          await expect(itemsGrid).toHaveScreenshot('shop-items-grid.png', {
            animations: 'disabled',
          });
        }
      }
    });
  });

  test.describe('Quests Page', () => {
    test('should match quests page screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const questsTab = page.getByText('Задания').or(page.getByText('Quests'));
      if (await questsTab.isVisible()) {
        await questsTab.click();
        await page.waitForTimeout(500);
        
        await expect(page).toHaveScreenshot('quests-page.png', {
          fullPage: true,
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Profile Page', () => {
    test('should match profile page screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const profileTab = page.getByText('Профиль').or(page.getByText('Profile'));
      if (await profileTab.isVisible()) {
        await profileTab.click();
        await page.waitForTimeout(500);
        
        await expect(page).toHaveScreenshot('profile-page.png', {
          fullPage: true,
          animations: 'disabled',
        });
      }
    });

    test('should match user stats section screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const profileTab = page.getByText('Профиль').or(page.getByText('Profile'));
      if (await profileTab.isVisible()) {
        await profileTab.click();
        await page.waitForTimeout(500);
        
        const statsSection = page.locator('[data-testid="user-stats"]').first();
        if (await statsSection.isVisible()) {
          await expect(statsSection).toHaveScreenshot('user-stats.png', {
            animations: 'disabled',
          });
        }
      }
    });
  });

  test.describe('Achievements Page', () => {
    test('should match achievements page screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const achievementsTab = page.getByText('Достижения').or(page.getByText('Achievements'));
      if (await achievementsTab.isVisible()) {
        await achievementsTab.click();
        await page.waitForTimeout(500);
        
        await expect(page).toHaveScreenshot('achievements-page.png', {
          fullPage: true,
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Modals', () => {
    test('should match daily rewards modal screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Try to open daily rewards modal via gift icon
      const giftButton = page.locator('[data-testid="daily-rewards-button"]').first();
      if (await giftButton.isVisible()) {
        await giftButton.click();
        await page.waitForTimeout(500);
        
        const modal = page.locator('[role="dialog"]').first();
        if (await modal.isVisible()) {
          await expect(modal).toHaveScreenshot('daily-rewards-modal.png', {
            animations: 'disabled',
          });
        }
      }
    });

    test('should match premium modal screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const premiumButton = page.locator('[data-testid="premium-button"]').first();
      if (await premiumButton.isVisible()) {
        await premiumButton.click();
        await page.waitForTimeout(500);
        
        const modal = page.locator('[role="dialog"]').first();
        if (await modal.isVisible()) {
          await expect(modal).toHaveScreenshot('premium-modal.png', {
            animations: 'disabled',
          });
        }
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should match mobile layout screenshot', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('mobile-layout.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match tablet layout screenshot', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('tablet-layout.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match desktop layout screenshot', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('desktop-layout.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Dark/Light Theme', () => {
    test('should match dark theme screenshot', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('dark-theme.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match light theme screenshot', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('light-theme.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Interactive States', () => {
    test('should match button hover states', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const button = page.locator('button').first();
      if (await button.isVisible()) {
        await button.hover();
        await page.waitForTimeout(300);
        
        await expect(button).toHaveScreenshot('button-hover.png', {
          animations: 'disabled',
        });
      }
    });

    test('should match navigation tab active state', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const nav = page.locator('nav').first();
      if (await nav.isVisible()) {
        await expect(nav).toHaveScreenshot('navigation-active.png', {
          animations: 'disabled',
        });
      }
    });
  });
});
