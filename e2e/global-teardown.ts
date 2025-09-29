import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting Playwright global teardown...');
  
  // Clean up test data, close connections, etc.
  
  // Example cleanup tasks:
  // - Remove test users
  // - Clean up test database
  // - Close external connections
  
  console.log('✅ Playwright global teardown complete');
}

export default globalTeardown;
