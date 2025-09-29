/**
 * Coverage Configuration
 * 
 * Environment-specific coverage settings and thresholds.
 * This file is used by Jest and coverage reporting tools.
 */

const path = require('path');

// Base coverage configuration
const baseCoverage = {
  // Coverage collection patterns
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'utils/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/__tests__/**',
    '!**/*.config.{js,ts}',
    '!**/layout.tsx',
    '!**/loading.tsx',
    '!**/not-found.tsx',
    '!**/error.tsx',
    '!**/global-error.tsx',
    '!**/page.tsx',
    '!**/middleware.ts',
    '!lib/config/**',
    '!lib/types/**',
    '!**/*.stories.{js,jsx,ts,tsx}',
    '!**/*.mock.{js,jsx,ts,tsx}',
  ],

  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json-summary',
    'cobertura',
  ],

  // Coverage directory
  coverageDirectory: 'coverage',

  // Coverage provider
  coverageProvider: 'v8',
};

// Environment-specific configurations
const environments = {
  development: {
    ...baseCoverage,
    coverageThreshold: {
      global: {
        branches: 60,
        functions: 60,
        lines: 60,
        statements: 60,
      },
    },
    coverageReporters: ['text', 'html'],
  },

  test: {
    ...baseCoverage,
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
      // Critical files require higher coverage
      './lib/auth/': {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
      './lib/security/': {
        branches: 95,
        functions: 95,
        lines: 95,
        statements: 95,
      },
      './lib/database/': {
        branches: 85,
        functions: 85,
        lines: 85,
        statements: 85,
      },
      // UI components can have slightly lower thresholds
      './components/': {
        branches: 75,
        functions: 75,
        lines: 75,
        statements: 75,
      },
    },
  },

  ci: {
    ...baseCoverage,
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
      './lib/auth/': {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
      './lib/security/': {
        branches: 95,
        functions: 95,
        lines: 95,
        statements: 95,
      },
    },
    coverageReporters: [
      'text-summary',
      'lcov',
      'json-summary',
      'cobertura',
    ],
  },

  production: {
    ...baseCoverage,
    coverageThreshold: {
      global: {
        branches: 85,
        functions: 85,
        lines: 85,
        statements: 85,
      },
      './lib/auth/': {
        branches: 95,
        functions: 95,
        lines: 95,
        statements: 95,
      },
      './lib/security/': {
        branches: 98,
        functions: 98,
        lines: 98,
        statements: 98,
      },
      './lib/database/': {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
    coverageReporters: [
      'json-summary',
      'lcov',
      'cobertura',
    ],
  },
};

// Security-critical files that require maximum coverage
const securityCriticalFiles = [
  'lib/auth/**/*.{js,jsx,ts,tsx}',
  'lib/security/**/*.{js,jsx,ts,tsx}',
  'middleware.ts',
  'lib/database/security.ts',
  'components/auth/**/*.{js,jsx,ts,tsx}',
];

// Performance-critical files that should be well-tested
const performanceCriticalFiles = [
  'lib/database/**/*.{js,jsx,ts,tsx}',
  'lib/cache/**/*.{js,jsx,ts,tsx}',
  'hooks/use-*.{js,jsx,ts,tsx}',
  'components/ui/**/*.{js,jsx,ts,tsx}',
];

// Files that can have lower coverage requirements
const lowPriorityFiles = [
  'app/**/page.tsx',
  'app/**/layout.tsx',
  'components/icons/**/*.{js,jsx,ts,tsx}',
  'lib/constants/**/*.{js,jsx,ts,tsx}',
  'lib/types/**/*.{js,jsx,ts,tsx}',
];

/**
 * Get coverage configuration for environment
 */
function getCoverageConfig(env = process.env.NODE_ENV || 'development') {
  const config = environments[env] || environments.development;
  
  // Add CI-specific settings
  if (process.env.CI === 'true') {
    config.coverageReporters = [
      ...config.coverageReporters,
      'json', // For CI reporting
    ];
  }
  
  return config;
}

/**
 * Get security coverage requirements
 */
function getSecurityCoverageConfig() {
  return {
    files: securityCriticalFiles,
    threshold: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  };
}

/**
 * Get performance coverage requirements
 */
function getPerformanceCoverageConfig() {
  return {
    files: performanceCriticalFiles,
    threshold: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  };
}

/**
 * Validate coverage configuration
 */
function validateCoverageConfig(config) {
  const required = ['collectCoverageFrom', 'coverageReporters', 'coverageThreshold'];
  
  for (const field of required) {
    if (!config[field]) {
      throw new Error(`Missing required coverage configuration: ${field}`);
    }
  }
  
  // Validate thresholds are reasonable
  const global = config.coverageThreshold.global;
  if (global) {
    Object.entries(global).forEach(([metric, threshold]) => {
      if (threshold < 0 || threshold > 100) {
        throw new Error(`Invalid coverage threshold for ${metric}: ${threshold}`);
      }
    });
  }
  
  return true;
}

/**
 * Generate coverage report configuration
 */
function getCoverageReportConfig() {
  return {
    outputDir: path.join(__dirname, 'coverage-reports'),
    formats: ['html', 'json', 'lcov', 'text'],
    includeUncoveredFiles: true,
    skipCoverage: false,
    watermarks: {
      statements: [80, 95],
      functions: [80, 95],
      branches: [80, 95],
      lines: [80, 95],
    },
  };
}

module.exports = {
  getCoverageConfig,
  getSecurityCoverageConfig,
  getPerformanceCoverageConfig,
  getCoverageReportConfig,
  validateCoverageConfig,
  securityCriticalFiles,
  performanceCriticalFiles,
  lowPriorityFiles,
  environments,
};
