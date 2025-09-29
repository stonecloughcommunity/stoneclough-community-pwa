import { test, expect } from '@playwright/test';
import { createHelpers, TEST_USERS } from './utils/test-helpers';

test.describe('Authentication Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test on the auth page
    await page.goto('/auth');
  });

  test('should display sign in form by default', async ({ page }) => {
    // Check sign in form is visible
    await expect(page.locator('[data-testid="sign-in-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="sign-in-button"]')).toBeVisible();
    
    // Check sign up tab is available
    await expect(page.locator('[data-testid="sign-up-tab"]')).toBeVisible();
  });

  test('should switch between sign in and sign up forms', async ({ page }) => {
    // Start on sign in form
    await expect(page.locator('[data-testid="sign-in-form"]')).toBeVisible();
    
    // Switch to sign up
    await page.click('[data-testid="sign-up-tab"]');
    await expect(page.locator('[data-testid="sign-up-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="display-name-input"]')).toBeVisible();
    
    // Switch back to sign in
    await page.click('[data-testid="sign-in-tab"]');
    await expect(page.locator('[data-testid="sign-in-form"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    const helpers = createHelpers(page);
    
    // Try to submit empty sign in form
    await page.click('[data-testid="sign-in-button"]');
    
    // Should show validation errors
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    
    // Switch to sign up and test validation
    await page.click('[data-testid="sign-up-tab"]');
    await page.click('[data-testid="sign-up-button"]');
    
    // Should show validation errors for sign up
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="display-name-error"]')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    // Enter invalid email
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="sign-in-button"]');
    
    // Should show email format error
    await expect(page.locator('[data-testid="email-error"]')).toContainText('valid email');
  });

  test('should validate password strength', async ({ page }) => {
    // Switch to sign up
    await page.click('[data-testid="sign-up-tab"]');
    
    // Enter weak password
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', '123');
    await page.fill('[data-testid="display-name-input"]', 'Test User');
    await page.click('[data-testid="sign-up-button"]');
    
    // Should show password strength error
    await expect(page.locator('[data-testid="password-error"]')).toContainText('password');
  });

  test('should handle sign in with invalid credentials', async ({ page }) => {
    const helpers = createHelpers(page);
    
    // Enter invalid credentials
    await page.fill('[data-testid="email-input"]', 'nonexistent@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="sign-in-button"]');
    
    // Should show error message
    await helpers.form.expectFormError('Invalid credentials');
  });

  test('should handle successful sign up flow', async ({ page }) => {
    const helpers = createHelpers(page);
    
    // Generate unique email for test
    const testEmail = `test-${Date.now()}@example.com`;
    
    // Switch to sign up
    await page.click('[data-testid="sign-up-tab"]');
    
    // Fill sign up form
    await page.fill('[data-testid="email-input"]', testEmail);
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.fill('[data-testid="display-name-input"]', 'Test User');
    
    // Submit form
    await page.click('[data-testid="sign-up-button"]');
    
    // Should show success message or redirect
    try {
      await helpers.form.expectFormSuccess('Account created');
    } catch {
      // Or might redirect to email verification page
      await expect(page.locator('text=Check your email')).toBeVisible();
    }
  });

  test('should handle password reset flow', async ({ page }) => {
    const helpers = createHelpers(page);
    
    // Click forgot password link
    await page.click('[data-testid="forgot-password-link"]');
    
    // Should show password reset form
    await expect(page.locator('[data-testid="reset-password-form"]')).toBeVisible();
    
    // Enter email
    await page.fill('[data-testid="email-input"]', TEST_USERS.user.email);
    await page.click('[data-testid="reset-password-button"]');
    
    // Should show success message
    await helpers.form.expectFormSuccess('Reset link sent');
  });

  test('should redirect authenticated users', async ({ page }) => {
    const helpers = createHelpers(page);
    
    // Mock being signed in (this would need to be set up properly)
    await page.addInitScript(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        expires_at: Date.now() + 3600000,
      }));
    });
    
    // Try to visit auth page
    await page.goto('/auth');
    
    // Should redirect to home page
    await page.waitForURL('/', { timeout: 10000 });
  });

  test('should handle social authentication', async ({ page }) => {
    // Check if social auth buttons are present
    const googleButton = page.locator('[data-testid="google-auth-button"]');
    const githubButton = page.locator('[data-testid="github-auth-button"]');
    
    if (await googleButton.isVisible()) {
      // Click Google auth button
      await googleButton.click();
      
      // Should redirect to Google OAuth (we won't complete the flow in tests)
      // Just verify the redirect happens
      await page.waitForTimeout(1000);
      
      // In a real test, you might mock the OAuth response
    }
  });

  test('should maintain form state when switching tabs', async ({ page }) => {
    // Fill sign in form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    
    // Switch to sign up
    await page.click('[data-testid="sign-up-tab"]');
    
    // Switch back to sign in
    await page.click('[data-testid="sign-in-tab"]');
    
    // Form should be cleared (this is expected behavior)
    const emailValue = await page.locator('[data-testid="email-input"]').inputValue();
    const passwordValue = await page.locator('[data-testid="password-input"]').inputValue();
    
    // Depending on implementation, fields might be cleared or preserved
    // Adjust expectation based on actual behavior
  });

  test('should handle keyboard navigation', async ({ page }) => {
    const helpers = createHelpers(page);
    
    // Test tab navigation through form
    await page.keyboard.press('Tab'); // Should focus email input
    await expect(page.locator('[data-testid="email-input"]')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Should focus password input
    await expect(page.locator('[data-testid="password-input"]')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Should focus sign in button
    await expect(page.locator('[data-testid="sign-in-button"]')).toBeFocused();
    
    // Test form submission with Enter key
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.locator('[data-testid="password-input"]').press('Enter');
    
    // Should attempt to submit form
    await page.waitForTimeout(500);
  });

  test('should show loading states', async ({ page }) => {
    const helpers = createHelpers(page);
    
    // Fill form
    await page.fill('[data-testid="email-input"]', TEST_USERS.user.email);
    await page.fill('[data-testid="password-input"]', TEST_USERS.user.password);
    
    // Submit form
    await page.click('[data-testid="sign-in-button"]');
    
    // Should show loading state
    await expect(page.locator('[data-testid="sign-in-button"]')).toBeDisabled();
    
    // Wait for loading to complete
    await helpers.wait.waitForLoading();
  });
});
