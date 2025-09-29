# End-to-End Testing Guide

This document describes the E2E testing setup and best practices for the Stoneclough Community PWA using Playwright.

## Overview

The project uses Playwright for comprehensive end-to-end testing across multiple browsers and devices. Tests cover critical user journeys, accessibility, performance, and cross-browser compatibility.

## Test Structure

```
e2e/
├── global-setup.ts        # Global test setup
├── global-teardown.ts     # Global test cleanup
├── utils/
│   └── test-helpers.ts    # Reusable test utilities
├── basic.spec.ts          # Basic application functionality
├── auth.spec.ts           # Authentication flows
├── community.spec.ts      # Community features
├── directory.spec.ts      # Directory functionality
├── events.spec.ts         # Events management
└── admin.spec.ts          # Admin panel tests
```

## Configuration

### playwright.config.ts
- **Test Directory**: `./e2e`
- **Base URL**: `http://localhost:3000` (configurable via `PLAYWRIGHT_BASE_URL`)
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Reporters**: HTML, JSON, JUnit
- **Artifacts**: Screenshots, videos, traces on failure

### Key Settings
- **Parallel Execution**: Tests run in parallel for speed
- **Retries**: 2 retries on CI, 0 locally
- **Timeouts**: 30s test timeout, 10s action timeout
- **Web Server**: Automatically starts dev server before tests

## Test Utilities

### Helper Classes

#### NavigationHelpers
```typescript
const helpers = createHelpers(page);
await helpers.navigation.goToHome();
await helpers.navigation.goToCommunity();
```

#### AuthHelpers
```typescript
await helpers.auth.signIn(email, password);
await helpers.auth.signOut();
await helpers.auth.signUp(email, password, displayName);
```

#### FormHelpers
```typescript
await helpers.form.fillForm({ email: 'test@example.com' });
await helpers.form.submitForm();
await helpers.form.expectFormError('Invalid email');
```

#### AccessibilityHelpers
```typescript
await helpers.accessibility.checkPageAccessibility();
await helpers.accessibility.checkKeyboardNavigation();
```

#### WaitHelpers
```typescript
await helpers.wait.waitForToast('Success message');
await helpers.wait.waitForModal('confirmation-modal');
await helpers.wait.waitForLoading();
```

## Running Tests

### Local Development

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test basic.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in debug mode
npx playwright test --debug

# Run tests for specific browser
npx playwright test --project=chromium

# Run tests in UI mode
npx playwright test --ui
```

### CI/CD

```bash
# Run tests in CI mode
npm run test:e2e:ci

# Generate and view HTML report
npx playwright show-report
```

## Test Categories

### 1. Basic Application Tests (`basic.spec.ts`)
- Homepage loading and navigation
- Responsive design on mobile
- 404 error handling
- Meta tags and SEO
- JavaScript error detection
- Search functionality
- Accessibility features
- Network condition handling

### 2. Authentication Tests (`auth.spec.ts`)
- Sign in/sign up form validation
- Email format validation
- Password strength requirements
- Invalid credential handling
- Password reset flow
- Social authentication
- Form state management
- Keyboard navigation
- Loading states

### 3. Community Tests (`community.spec.ts`)
- Post display and creation
- Like and comment functionality
- Post filtering and search
- Content moderation
- Infinite scroll
- Real-time updates
- Empty states

## Best Practices

### Test Data Management

1. **Use Test Users**: Predefined test accounts for different roles
2. **Generate Unique Data**: Use timestamps for unique test data
3. **Clean Up**: Remove test data after tests (when possible)
4. **Isolation**: Each test should be independent

### Page Object Pattern

```typescript
class CommunityPage {
  constructor(private page: Page) {}

  async createPost(content: string) {
    await this.page.click('[data-testid="create-post-button"]');
    await this.page.fill('[data-testid="post-content-input"]', content);
    await this.page.click('[data-testid="submit-post-button"]');
  }

  async getPostCount() {
    return await this.page.locator('[data-testid="community-post"]').count();
  }
}
```

### Selectors Strategy

1. **Prefer data-testid**: `[data-testid="element-id"]`
2. **Use semantic selectors**: `page.getByRole('button', { name: 'Submit' })`
3. **Avoid CSS selectors**: They're brittle and break with styling changes
4. **Use text selectors sparingly**: Only for unique, stable text

### Assertions

```typescript
// Good - specific and meaningful
await expect(page.locator('[data-testid="success-message"]')).toContainText('Post created');

// Good - semantic
await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();

// Avoid - too generic
await expect(page.locator('.message')).toBeVisible();
```

### Error Handling

```typescript
test('should handle network errors gracefully', async ({ page }) => {
  // Simulate network failure
  await page.route('**/api/**', route => route.abort());
  
  await page.goto('/community');
  
  // Should show error state
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
});
```

## Debugging Tests

### Visual Debugging

```bash
# Run with browser visible
npx playwright test --headed

# Run in debug mode (step through)
npx playwright test --debug

# Run specific test in debug mode
npx playwright test auth.spec.ts --debug
```

### Screenshots and Videos

```typescript
// Take screenshot
await page.screenshot({ path: 'debug-screenshot.png' });

// Take element screenshot
await page.locator('[data-testid="form"]').screenshot({ path: 'form.png' });
```

### Console Logs

```typescript
// Listen to console messages
page.on('console', msg => console.log('PAGE LOG:', msg.text()));

// Listen to page errors
page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
```

### Trace Viewer

```bash
# Generate trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

## Performance Testing

### Core Web Vitals

```typescript
test('should meet Core Web Vitals thresholds', async ({ page }) => {
  await page.goto('/');
  
  // Measure performance
  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        resolve(entries);
      }).observe({ entryTypes: ['navigation', 'paint'] });
    });
  });
  
  // Assert performance thresholds
  // Implementation depends on specific metrics
});
```

### Lighthouse Integration

```typescript
// Using playwright-lighthouse
import { playAudit } from 'playwright-lighthouse';

test('should pass Lighthouse audit', async ({ page }) => {
  await page.goto('/');
  
  await playAudit({
    page,
    thresholds: {
      performance: 90,
      accessibility: 95,
      'best-practices': 90,
      seo: 90,
    },
  });
});
```

## Accessibility Testing

### Automated Accessibility

```typescript
// Using @axe-core/playwright
import { injectAxe, checkA11y } from 'axe-playwright';

test('should be accessible', async ({ page }) => {
  await page.goto('/');
  await injectAxe(page);
  await checkA11y(page);
});
```

### Manual Accessibility Checks

```typescript
test('should support keyboard navigation', async ({ page }) => {
  await page.goto('/');
  
  // Test tab navigation
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
  
  // Test skip links
  await page.keyboard.press('Tab');
  const skipLink = page.locator('a[href="#main-content"]');
  if (await skipLink.isVisible()) {
    await skipLink.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  }
});
```

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e:ci
        env:
          PLAYWRIGHT_BASE_URL: http://localhost:3000
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Monitoring and Reporting

### Test Reports

- **HTML Report**: Interactive report with screenshots and videos
- **JSON Report**: Machine-readable results for CI/CD
- **JUnit Report**: Compatible with most CI systems

### Metrics Tracking

- Test execution time
- Flaky test detection
- Browser compatibility issues
- Performance regression detection

## Troubleshooting

### Common Issues

1. **Timeouts**: Increase timeout or improve wait conditions
2. **Flaky Tests**: Add proper waits and make tests more robust
3. **Element Not Found**: Check selectors and timing
4. **Network Issues**: Mock external dependencies

### Debug Commands

```bash
# Show browser console
npx playwright test --headed --debug

# Generate detailed trace
npx playwright test --trace on --headed

# Run single test with full output
npx playwright test specific-test.spec.ts --reporter=line
```
