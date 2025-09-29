import { Page, expect } from '@playwright/test';

// Test user data
export const TEST_USERS = {
  admin: {
    email: 'admin@stoneclough.uk',
    password: 'TestPassword123!',
    displayName: 'Test Admin',
  },
  user: {
    email: 'user@stoneclough.uk',
    password: 'TestPassword123!',
    displayName: 'Test User',
  },
  volunteer: {
    email: 'volunteer@stoneclough.uk',
    password: 'TestPassword123!',
    displayName: 'Test Volunteer',
  },
};

// Navigation helpers
export class NavigationHelpers {
  constructor(private page: Page) {}

  async goToHome() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async goToAuth() {
    await this.page.goto('/auth');
    await this.page.waitForLoadState('networkidle');
  }

  async goToCommunity() {
    await this.page.goto('/community');
    await this.page.waitForLoadState('networkidle');
  }

  async goToDirectory() {
    await this.page.goto('/directory');
    await this.page.waitForLoadState('networkidle');
  }

  async goToProfile() {
    await this.page.goto('/profile');
    await this.page.waitForLoadState('networkidle');
  }

  async goToAdmin() {
    await this.page.goto('/admin');
    await this.page.waitForLoadState('networkidle');
  }
}

// Authentication helpers
export class AuthHelpers {
  constructor(private page: Page) {}

  async signIn(email: string, password: string) {
    await this.page.goto('/auth');
    
    // Fill in login form
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    
    // Submit form
    await this.page.click('[data-testid="sign-in-button"]');
    
    // Wait for redirect
    await this.page.waitForURL('/', { timeout: 10000 });
    
    // Verify signed in
    await expect(this.page.locator('[data-testid="user-menu"]')).toBeVisible();
  }

  async signOut() {
    // Open user menu
    await this.page.click('[data-testid="user-menu"]');
    
    // Click sign out
    await this.page.click('[data-testid="sign-out-button"]');
    
    // Wait for redirect to auth page
    await this.page.waitForURL('/auth', { timeout: 10000 });
  }

  async signUp(email: string, password: string, displayName: string) {
    await this.page.goto('/auth');
    
    // Switch to sign up tab
    await this.page.click('[data-testid="sign-up-tab"]');
    
    // Fill in form
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.fill('[data-testid="display-name-input"]', displayName);
    
    // Submit form
    await this.page.click('[data-testid="sign-up-button"]');
    
    // Wait for success message or redirect
    await expect(this.page.locator('[data-testid="success-message"]')).toBeVisible();
  }

  async isSignedIn(): Promise<boolean> {
    try {
      await expect(this.page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

// Form helpers
export class FormHelpers {
  constructor(private page: Page) {}

  async fillForm(formData: Record<string, string>) {
    for (const [field, value] of Object.entries(formData)) {
      await this.page.fill(`[data-testid="${field}-input"]`, value);
    }
  }

  async submitForm(buttonTestId: string = 'submit-button') {
    await this.page.click(`[data-testid="${buttonTestId}"]`);
  }

  async expectFormError(message: string) {
    await expect(this.page.locator('[data-testid="form-error"]')).toContainText(message);
  }

  async expectFormSuccess(message: string) {
    await expect(this.page.locator('[data-testid="form-success"]')).toContainText(message);
  }
}

// Accessibility helpers
export class AccessibilityHelpers {
  constructor(private page: Page) {}

  async checkPageAccessibility() {
    // Check for basic accessibility requirements
    
    // Check for page title
    const title = await this.page.title();
    expect(title).toBeTruthy();
    expect(title).not.toBe('');
    
    // Check for main landmark
    await expect(this.page.locator('main, [role="main"]')).toBeVisible();
    
    // Check for heading hierarchy (should have h1)
    await expect(this.page.locator('h1')).toBeVisible();
    
    // Check for skip link (accessibility feature)
    const skipLink = this.page.locator('a[href="#main-content"], a[href="#content"]');
    if (await skipLink.count() > 0) {
      await expect(skipLink).toBeVisible();
    }
  }

  async checkKeyboardNavigation() {
    // Test tab navigation
    await this.page.keyboard.press('Tab');
    
    // Check that focus is visible
    const focusedElement = await this.page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  }

  async checkColorContrast() {
    // This would require additional tools like axe-playwright
    // For now, we'll do basic checks
    
    // Check that text is not using very light colors on light backgrounds
    const bodyStyles = await this.page.locator('body').evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
      };
    });
    
    // Basic check - ensure colors are defined
    expect(bodyStyles.color).toBeTruthy();
    expect(bodyStyles.backgroundColor).toBeTruthy();
  }
}

// Wait helpers
export class WaitHelpers {
  constructor(private page: Page) {}

  async waitForToast(message?: string) {
    const toast = this.page.locator('[data-testid="toast"]');
    await expect(toast).toBeVisible();
    
    if (message) {
      await expect(toast).toContainText(message);
    }
    
    // Wait for toast to disappear
    await expect(toast).toBeHidden({ timeout: 10000 });
  }

  async waitForModal(modalTestId: string = 'modal') {
    await expect(this.page.locator(`[data-testid="${modalTestId}"]`)).toBeVisible();
  }

  async waitForLoading() {
    // Wait for loading spinner to appear and disappear
    const loading = this.page.locator('[data-testid="loading"]');
    
    try {
      await expect(loading).toBeVisible({ timeout: 1000 });
      await expect(loading).toBeHidden({ timeout: 10000 });
    } catch {
      // Loading might not appear if operation is fast
    }
  }

  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }
}

// Screenshot helpers
export class ScreenshotHelpers {
  constructor(private page: Page) {}

  async takeFullPageScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }

  async takeElementScreenshot(selector: string, name: string) {
    await this.page.locator(selector).screenshot({
      path: `test-results/screenshots/${name}.png`,
    });
  }
}

// Create helper instances
export function createHelpers(page: Page) {
  return {
    navigation: new NavigationHelpers(page),
    auth: new AuthHelpers(page),
    form: new FormHelpers(page),
    accessibility: new AccessibilityHelpers(page),
    wait: new WaitHelpers(page),
    screenshot: new ScreenshotHelpers(page),
  };
}
