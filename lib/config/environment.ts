// Environment configuration for Stoneclough PWA
// Validates and provides typed access to environment variables

interface EnvironmentConfig {
  // App Configuration
  nodeEnv: 'development' | 'production' | 'test'
  appUrl: string
  
  // Supabase Configuration
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseServiceRoleKey?: string
  
  // Authentication
  authRedirectUrl: string
  
  // Push Notifications
  vapidPublicKey?: string
  vapidPrivateKey?: string
  
  // Error Monitoring
  sentryDsn?: string
  sentryOrg?: string
  sentryProject?: string
  
  // Analytics
  googleAnalyticsId?: string
  posthogKey?: string
  posthogHost?: string
  
  // Community Settings
  communityName: string
  communityShortName: string
  supportEmail: string
  adminEmail: string
  
  // Feature Flags
  enableBetaFeatures: boolean
  enableAnalytics: boolean
  enablePushNotifications: boolean
  enableDevtools: boolean
  
  // File Upload
  cloudinaryCloudName?: string
  cloudinaryApiKey?: string
  cloudinaryApiSecret?: string
  
  // Rate Limiting
  upstashRedisUrl?: string
  upstashRedisToken?: string

  // Session Management
  sessionTimeoutMinutes: number
  sessionWarningThresholdMinutes: number
  cronSecret?: string
}

function getRequiredEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`)
  }
  return value
}

function getOptionalEnvVar(name: string): string | undefined {
  return process.env[name] || undefined
}

function getBooleanEnvVar(name: string, defaultValue: boolean = false): boolean {
  const value = process.env[name]
  if (!value) return defaultValue
  return value.toLowerCase() === 'true'
}

// Validate and create environment configuration
export const env: EnvironmentConfig = {
  // App Configuration
  nodeEnv: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  appUrl: getOptionalEnvVar('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000',
  
  // Supabase Configuration (Required)
  supabaseUrl: getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: getOptionalEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
  
  // Authentication
  authRedirectUrl: getOptionalEnvVar('NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL') || 
    `${getOptionalEnvVar('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000'}/auth/callback`,
  
  // Push Notifications
  vapidPublicKey: getOptionalEnvVar('NEXT_PUBLIC_VAPID_PUBLIC_KEY'),
  vapidPrivateKey: getOptionalEnvVar('VAPID_PRIVATE_KEY'),
  
  // Error Monitoring
  sentryDsn: getOptionalEnvVar('NEXT_PUBLIC_SENTRY_DSN'),
  sentryOrg: getOptionalEnvVar('SENTRY_ORG'),
  sentryProject: getOptionalEnvVar('SENTRY_PROJECT'),
  
  // Analytics
  googleAnalyticsId: getOptionalEnvVar('NEXT_PUBLIC_GOOGLE_ANALYTICS_ID'),
  posthogKey: getOptionalEnvVar('NEXT_PUBLIC_POSTHOG_KEY'),
  posthogHost: getOptionalEnvVar('NEXT_PUBLIC_POSTHOG_HOST'),
  
  // Community Settings
  communityName: getOptionalEnvVar('NEXT_PUBLIC_COMMUNITY_NAME') || 'Stoneclough, Prestolee & Ringley',
  communityShortName: getOptionalEnvVar('NEXT_PUBLIC_COMMUNITY_SHORT_NAME') || 'Village Community',
  supportEmail: getOptionalEnvVar('NEXT_PUBLIC_SUPPORT_EMAIL') || 'support@stoneclough.uk',
  adminEmail: getOptionalEnvVar('NEXT_PUBLIC_ADMIN_EMAIL') || 'admin@stoneclough.uk',
  
  // Feature Flags
  enableBetaFeatures: getBooleanEnvVar('NEXT_PUBLIC_ENABLE_BETA_FEATURES', false),
  enableAnalytics: getBooleanEnvVar('NEXT_PUBLIC_ENABLE_ANALYTICS', true),
  enablePushNotifications: getBooleanEnvVar('NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS', true),
  enableDevtools: getBooleanEnvVar('NEXT_PUBLIC_ENABLE_DEVTOOLS', false),
  
  // File Upload
  cloudinaryCloudName: getOptionalEnvVar('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'),
  cloudinaryApiKey: getOptionalEnvVar('CLOUDINARY_API_KEY'),
  cloudinaryApiSecret: getOptionalEnvVar('CLOUDINARY_API_SECRET'),
  
  // Rate Limiting
  upstashRedisUrl: getOptionalEnvVar('UPSTASH_REDIS_REST_URL'),
  upstashRedisToken: getOptionalEnvVar('UPSTASH_REDIS_REST_TOKEN'),

  // Session Management
  sessionTimeoutMinutes: parseInt(getOptionalEnvVar('SESSION_TIMEOUT_MINUTES') || '30', 10),
  sessionWarningThresholdMinutes: parseInt(getOptionalEnvVar('SESSION_WARNING_THRESHOLD_MINUTES') || '5', 10),
  cronSecret: getOptionalEnvVar('CRON_SECRET'),
}

// Validation functions
export function validateEnvironment(): void {
  const errors: string[] = []
  
  // Check required variables
  if (!env.supabaseUrl) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
  }
  
  if (!env.supabaseAnonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  }
  
  // Validate URLs
  try {
    new URL(env.supabaseUrl)
  } catch {
    errors.push('NEXT_PUBLIC_SUPABASE_URL must be a valid URL')
  }
  
  try {
    new URL(env.appUrl)
  } catch {
    errors.push('NEXT_PUBLIC_APP_URL must be a valid URL')
  }
  
  // Production-specific validations
  if (env.nodeEnv === 'production') {
    if (!env.sentryDsn) {
      console.warn('Warning: NEXT_PUBLIC_SENTRY_DSN not set for production')
    }
    
    if (!env.vapidPublicKey || !env.vapidPrivateKey) {
      console.warn('Warning: VAPID keys not set - push notifications will not work')
    }
    
    if (env.appUrl.includes('localhost')) {
      errors.push('NEXT_PUBLIC_APP_URL should not be localhost in production')
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`)
  }
}

// Helper functions for feature flags
export const isFeatureEnabled = {
  betaFeatures: () => env.enableBetaFeatures,
  analytics: () => env.enableAnalytics,
  pushNotifications: () => env.enablePushNotifications && !!env.vapidPublicKey,
  devtools: () => env.enableDevtools && env.nodeEnv === 'development',
  fileUpload: () => !!env.cloudinaryCloudName,
  rateLimiting: () => !!env.upstashRedisUrl && !!env.upstashRedisToken,
}

// Environment-specific configurations
export const isDevelopment = env.nodeEnv === 'development'
export const isProduction = env.nodeEnv === 'production'
export const isTest = env.nodeEnv === 'test'

// Validate environment on import (except in test)
if (!isTest) {
  validateEnvironment()
}
