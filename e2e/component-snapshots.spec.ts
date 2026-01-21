import { test, expect } from '@playwright/test';

test.describe('Component Visual Snapshots', () => {
  test.describe('Cards', () => {
    test('should match product card screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Navigate to shop for product cards
      const shopTab = page.getByText('Магазин').or(page.getByText('Shop'));
      if (await shopTab.isVisible()) {
        await shopTab.click();
        await page.waitForTimeout(500);
        
        const card = page.locator('[data-testid="product-card"]').first();
        if (await card.isVisible()) {
          await expect(card).toHaveScreenshot('product-card.png', {
            animations: 'disabled',
          });
        }
      }
    });

    test('should match quest card screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const questsTab = page.getByText('Задания').or(page.getByText('Quests'));
      if (await questsTab.isVisible()) {
        await questsTab.click();
        await page.waitForTimeout(500);
        
        const questCard = page.locator('[data-testid="quest-card"]').first();
        if (await questCard.isVisible()) {
          await expect(questCard).toHaveScreenshot('quest-card.png', {
            animations: 'disabled',
          });
        }
      }
    });

    test('should match achievement card screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const achievementsTab = page.getByText('Достижения').or(page.getByText('Achievements'));
      if (await achievementsTab.isVisible()) {
        await achievementsTab.click();
        await page.waitForTimeout(500);
        
        const achievementCard = page.locator('[data-testid="achievement-card"]').first();
        if (await achievementCard.isVisible()) {
          await expect(achievementCard).toHaveScreenshot('achievement-card.png', {
            animations: 'disabled',
          });
        }
      }
    });
  });

  test.describe('Buttons', () => {
    test('should match primary button screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const primaryButton = page.locator('button.bg-primary').first();
      if (await primaryButton.isVisible()) {
        await expect(primaryButton).toHaveScreenshot('primary-button.png', {
          animations: 'disabled',
        });
      }
    });

    test('should match secondary button screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const secondaryButton = page.locator('button.bg-secondary').first();
      if (await secondaryButton.isVisible()) {
        await expect(secondaryButton).toHaveScreenshot('secondary-button.png', {
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Progress Indicators', () => {
    test('should match progress bar screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const progressBar = page.locator('[role="progressbar"]').first();
      if (await progressBar.isVisible()) {
        await expect(progressBar).toHaveScreenshot('progress-bar.png', {
          animations: 'disabled',
        });
      }
    });

    test('should match level indicator screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const levelIndicator = page.locator('[data-testid="level-indicator"]').first();
      if (await levelIndicator.isVisible()) {
        await expect(levelIndicator).toHaveScreenshot('level-indicator.png', {
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Badges', () => {
    test('should match rarity badge screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const badge = page.locator('[data-testid="rarity-badge"]').first();
      if (await badge.isVisible()) {
        await expect(badge).toHaveScreenshot('rarity-badge.png', {
          animations: 'disabled',
        });
      }
    });

    test('should match premium badge screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const premiumBadge = page.locator('[data-testid="premium-badge"]').first();
      if (await premiumBadge.isVisible()) {
        await expect(premiumBadge).toHaveScreenshot('premium-badge.png', {
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Icons and Emojis', () => {
    test('should match currency icons screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const crystalIcon = page.locator('[data-testid="crystal-icon"]').first();
      if (await crystalIcon.isVisible()) {
        await expect(crystalIcon).toHaveScreenshot('crystal-icon.png', {
          animations: 'disabled',
        });
      }
      
      const diamondIcon = page.locator('[data-testid="diamond-icon"]').first();
      if (await diamondIcon.isVisible()) {
        await expect(diamondIcon).toHaveScreenshot('diamond-icon.png', {
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Banners', () => {
    test('should match demo banner screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const demoBanner = page.locator('[data-testid="demo-banner"]').first();
      if (await demoBanner.isVisible()) {
        await expect(demoBanner).toHaveScreenshot('demo-banner.png', {
          animations: 'disabled',
        });
      }
    });

    test('should match seasonal banner screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const seasonalBanner = page.locator('[data-testid="seasonal-banner"]').first();
      if (await seasonalBanner.isVisible()) {
        await expect(seasonalBanner).toHaveScreenshot('seasonal-banner.png', {
          animations: 'disabled',
        });
      }
    });

    test('should match promotions banner screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const promotionsBanner = page.locator('[data-testid="promotions-banner"]').first();
      if (await promotionsBanner.isVisible()) {
        await expect(promotionsBanner).toHaveScreenshot('promotions-banner.png', {
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Pet Display', () => {
    test('should match animated pet screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const pet = page.locator('[data-testid="animated-pet"]').first();
      if (await pet.isVisible()) {
        await expect(pet).toHaveScreenshot('animated-pet.png', {
          animations: 'disabled',
        });
      }
    });

    test('should match pet selector screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const petSelector = page.locator('[data-testid="pet-selector"]').first();
      if (await petSelector.isVisible()) {
        await expect(petSelector).toHaveScreenshot('pet-selector.png', {
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Reward Displays', () => {
    test('should match reward calendar screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Open daily rewards modal
      const giftButton = page.locator('[data-testid="daily-rewards-button"]').first();
      if (await giftButton.isVisible()) {
        await giftButton.click();
        await page.waitForTimeout(500);
        
        const rewardCalendar = page.locator('[data-testid="reward-calendar"]').first();
        if (await rewardCalendar.isVisible()) {
          await expect(rewardCalendar).toHaveScreenshot('reward-calendar.png', {
            animations: 'disabled',
          });
        }
      }
    });

    test('should match streak indicator screenshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const streakIndicator = page.locator('[data-testid="streak-indicator"]').first();
      if (await streakIndicator.isVisible()) {
        await expect(streakIndicator).toHaveScreenshot('streak-indicator.png', {
          animations: 'disabled',
        });
      }
    });
  });
});
