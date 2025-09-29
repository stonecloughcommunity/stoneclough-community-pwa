/**
 * Test Configuration
 * 
 * Central configuration for all test environments and settings.
 * This file defines test database connections, mock configurations,
 * and environment-specific test settings.
 */

// Test environment configuration
export const testConfig = {
  // Database configuration
  database: {
    // Use separate test database URL if available
    url: process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceKey: process.env.TEST_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: process.env.TEST_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    
    // Test data configuration
    seedData: {
      users: 4,
      departments: 6,
      posts: 10,
      events: 5,
      directoryEntries: 8,
      jobPostings: 6,
    },
    
    // Cleanup configuration
    cleanup: {
      afterEach: false, // Set to true for tests that need clean state
      afterAll: true,   // Always cleanup after test suite
      timeout: 30000,   // Cleanup timeout in ms
    },
  },

  // API testing configuration
  api: {
    baseUrl: process.env.TEST_API_BASE_URL || 'http://localhost:3000',
    timeout: 10000,
    retries: 2,
    
    // Rate limiting test configuration
    rateLimiting: {
      enabled: process.env.NODE_ENV !== 'test',
      requestsPerMinute: 100,
      testBypass: true,
    },
  },

  // Authentication testing
  auth: {
    testUsers: {
      admin: {
        email: 'admin@test.stoneclough.uk',
        password: 'TestPassword123!',
      },
      user: {
        email: 'user@test.stoneclough.uk',
        password: 'TestPassword123!',
      },
      senior: {
        email: 'senior@test.stoneclough.uk',
        password: 'TestPassword123!',
      },
      volunteer: {
        email: 'volunteer@test.stoneclough.uk',
        password: 'TestPassword123!',
      },
    },
    
    // JWT configuration for testing
    jwt: {
      secret: process.env.TEST_JWT_SECRET || 'test-jwt-secret',
      expiresIn: '1h',
    },
  },

  // E2E testing configuration
  e2e: {
    baseUrl: process.env.TEST_E2E_BASE_URL || 'http://localhost:3000',
    headless: process.env.CI === 'true',
    slowMo: process.env.CI === 'true' ? 0 : 100,
    timeout: 30000,
    
    // Browser configuration
    browsers: ['chromium', 'firefox', 'webkit'],
    viewport: {
      width: 1280,
      height: 720,
    },
    
    // Mobile testing
    mobile: {
      enabled: true,
      devices: ['iPhone 12', 'Pixel 5', 'iPad'],
    },
  },

  // Performance testing
  performance: {
    enabled: process.env.NODE_ENV !== 'test',
    thresholds: {
      // Core Web Vitals thresholds
      lcp: 2500,  // Largest Contentful Paint (ms)
      fid: 100,   // First Input Delay (ms)
      cls: 0.1,   // Cumulative Layout Shift
      
      // Custom thresholds
      pageLoad: 3000,     // Page load time (ms)
      apiResponse: 1000,  // API response time (ms)
      bundleSize: 500000, // Bundle size (bytes)
    },
    
    // Lighthouse configuration
    lighthouse: {
      enabled: process.env.CI === 'true',
      categories: ['performance', 'accessibility', 'best-practices', 'seo'],
      thresholds: {
        performance: 90,
        accessibility: 95,
        'best-practices': 90,
        seo: 90,
      },
    },
  },

  // Mock configuration
  mocks: {
    // External API mocks
    apis: {
      enabled: true,
      delay: 100, // Simulate network delay
    },
    
    // File system mocks
    filesystem: {
      enabled: true,
      tempDir: '/tmp/test-uploads',
    },
    
    // Email service mocks
    email: {
      enabled: true,
      captureEmails: true,
      logEmails: process.env.NODE_ENV === 'development',
    },
    
    // Push notification mocks
    pushNotifications: {
      enabled: true,
      simulateFailures: false,
    },
  },

  // Accessibility testing
  accessibility: {
    enabled: true,
    standards: ['WCAG2A', 'WCAG2AA'],
    
    // axe-core configuration
    axe: {
      rules: {
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-management': { enabled: true },
        'aria-labels': { enabled: true },
      },
    },
    
    // Screen reader testing
    screenReader: {
      enabled: false, // Enable for comprehensive accessibility testing
      tools: ['nvda', 'jaws', 'voiceover'],
    },
  },

  // Security testing
  security: {
    enabled: true,
    
    // CSRF testing
    csrf: {
      enabled: true,
      testBypass: process.env.NODE_ENV === 'test',
    },
    
    // XSS testing
    xss: {
      enabled: true,
      payloads: [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(\'xss\')">',
      ],
    },
    
    // SQL injection testing
    sqlInjection: {
      enabled: true,
      payloads: [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "1' UNION SELECT * FROM users --",
      ],
    },
  },

  // Logging configuration
  logging: {
    level: process.env.TEST_LOG_LEVEL || 'warn',
    console: process.env.NODE_ENV === 'development',
    file: false,
    
    // Test result logging
    results: {
      enabled: true,
      format: 'json',
      includeStackTrace: true,
    },
  },

  // Parallel testing
  parallel: {
    enabled: process.env.CI === 'true',
    workers: process.env.CI === 'true' ? 2 : 1,
    maxConcurrency: 4,
  },

  // Test data generation
  dataGeneration: {
    seed: 12345, // Fixed seed for reproducible tests
    locale: 'en_GB',
    
    // Faker configuration
    faker: {
      seed: 12345,
      locale: 'en_GB',
    },
  },

  // Coverage configuration
  coverage: {
    enabled: true,
    threshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    
    // Directories to include/exclude
    include: [
      'app/**/*.{ts,tsx}',
      'components/**/*.{ts,tsx}',
      'lib/**/*.{ts,tsx}',
    ],
    exclude: [
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      '**/__tests__/**',
      '**/node_modules/**',
      '**/.next/**',
    ],
  },

  // Snapshot testing
  snapshots: {
    enabled: true,
    updateOnCI: false,
    threshold: 0.2, // Pixel difference threshold
    
    // Visual regression testing
    visual: {
      enabled: process.env.CI === 'true',
      threshold: 0.1,
      browsers: ['chromium'],
    },
  },
};

/**
 * Get configuration for specific test environment
 */
export function getTestConfig(environment: 'unit' | 'integration' | 'e2e' | 'performance' = 'unit') {
  const baseConfig = { ...testConfig };
  
  switch (environment) {
    case 'unit':
      return {
        ...baseConfig,
        database: {
          ...baseConfig.database,
          cleanup: { ...baseConfig.database.cleanup, afterEach: false },
        },
        mocks: {
          ...baseConfig.mocks,
          apis: { ...baseConfig.mocks.apis, enabled: true },
        },
      };
      
    case 'integration':
      return {
        ...baseConfig,
        database: {
          ...baseConfig.database,
          cleanup: { ...baseConfig.database.cleanup, afterEach: true },
        },
        mocks: {
          ...baseConfig.mocks,
          apis: { ...baseConfig.mocks.apis, enabled: false },
        },
      };
      
    case 'e2e':
      return {
        ...baseConfig,
        database: {
          ...baseConfig.database,
          cleanup: { ...baseConfig.database.cleanup, afterEach: true },
        },
        mocks: {
          ...baseConfig.mocks,
          apis: { ...baseConfig.mocks.apis, enabled: false },
        },
      };
      
    case 'performance':
      return {
        ...baseConfig,
        performance: {
          ...baseConfig.performance,
          enabled: true,
        },
        logging: {
          ...baseConfig.logging,
          level: 'error', // Reduce noise during performance tests
        },
      };
      
    default:
      return baseConfig;
  }
}

/**
 * Validate test configuration
 */
export function validateTestConfig(): void {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  if (!testConfig.database.url) {
    throw new Error('Database URL is required for testing');
  }
  
  if (!testConfig.database.serviceKey) {
    throw new Error('Database service key is required for testing');
  }
}

/**
 * Initialize test configuration
 */
export function initializeTestConfig(): void {
  try {
    validateTestConfig();
    console.log('✅ Test configuration validated');
  } catch (error) {
    console.error('❌ Test configuration validation failed:', error);
    throw error;
  }
}
