import { test, expect } from '@playwright/test';
import { createHelpers } from './utils/test-helpers';

test.describe('Basic Application Tests', () => {
  test('should load the homepage', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await helpers.navigation.goToHome();
    
    // Check page title
    await expect(page).toHaveTitle(/Stoneclough/);
    
    // Check main content is visible
    await expect(page.locator('main')).toBeVisible();
    
    // Check navigation is present
    await expect(page.locator('nav')).toBeVisible();
    
    // Check footer is present
    await expect(page.locator('footer')).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await helpers.navigation.goToHome();
    
    // Test navigation links
    const navLinks = [
      { text: 'Community', url: '/community' },
      { text: 'Directory', url: '/directory' },
      { text: 'Events', url: '/events' },
    ];
    
    for (const link of navLinks) {
      // Click navigation link
      await page.click(`text=${link.text}`);
      
      // Wait for navigation
      await page.waitForURL(`**${link.url}`, { timeout: 10000 });
      
      // Verify we're on the correct page
      expect(page.url()).toContain(link.url);
      
      // Go back to home
      await helpers.navigation.goToHome();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    const helpers = createHelpers(page);
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await helpers.navigation.goToHome();
    
    // Check mobile navigation (hamburger menu)
    const mobileMenu = page.locator('[data-testid="mobile-menu-button"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      
      // Check mobile menu is open
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Close menu
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeHidden();
    }
    
    // Check content is still accessible
    await expect(page.locator('main')).toBeVisible();
  });

  test('should handle 404 pages', async ({ page }) => {
    await page.goto('/non-existent-page');
    
    // Should show 404 page
    await expect(page.locator('text=404')).toBeVisible();
    await expect(page.locator('text=Page not found')).toBeVisible();
    
    // Should have link back to home
    await page.click('text=Go home');
    await page.waitForURL('/', { timeout: 10000 });
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check essential meta tags
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDescription).toBeTruthy();
    expect(metaDescription!.length).toBeGreaterThan(50);
    
    // Check Open Graph tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();
    
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
    expect(ogDescription).toBeTruthy();
    
    // Check viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    
    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Listen for page errors
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out known acceptable errors (like network errors in test environment)
    const criticalErrors = errors.filter(error => 
      !error.includes('Failed to fetch') &&
      !error.includes('NetworkError') &&
      !error.includes('ERR_INTERNET_DISCONNECTED')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should have working search functionality', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await helpers.navigation.goToHome();
    
    // Look for search input
    const searchInput = page.locator('[data-testid="search-input"]');
    
    if (await searchInput.isVisible()) {
      // Test search functionality
      await searchInput.fill('test search');
      await page.keyboard.press('Enter');
      
      // Should show search results or navigate to search page
      await page.waitForLoadState('networkidle');
      
      // Verify search was performed
      const url = page.url();
      expect(url).toMatch(/search|query/);
    }
  });

  test('should have accessibility features', async ({ page }) => {
    const helpers = createHelpers(page);
    
    await helpers.navigation.goToHome();
    
    // Check basic accessibility
    await helpers.accessibility.checkPageAccessibility();
    
    // Test keyboard navigation
    await helpers.accessibility.checkKeyboardNavigation();
    
    // Check for accessibility toolbar if present
    const accessibilityButton = page.locator('[data-testid="accessibility-button"]');
    if (await accessibilityButton.isVisible()) {
      await accessibilityButton.click();
      
      // Check accessibility panel opens
      await expect(page.locator('[data-testid="accessibility-panel"]')).toBeVisible();
      
      // Test some accessibility features
      const largeTextButton = page.locator('[data-testid="large-text-toggle"]');
      if (await largeTextButton.isVisible()) {
        await largeTextButton.click();
        
        // Verify large text is applied
        const body = page.locator('body');
        await expect(body).toHaveClass(/large-text|text-lg|text-xl/);
      }
    }
  });

  test('should handle slow network conditions', async ({ page }) => {
    // Simulate slow network
    await page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
      await route.continue();
    });
    
    const helpers = createHelpers(page);
    await helpers.navigation.goToHome();
    
    // Should still load successfully
    await expect(page.locator('main')).toBeVisible();
    
    // Check loading states are handled properly
    await helpers.wait.waitForNetworkIdle();
  });
});
