import * as Sentry from "@sentry/nextjs";
import { env } from "@/lib/config/environment";

Sentry.init({
  dsn: env.sentryDsn,
  
  // Set tracesSampleRate to 1.0 to capture 100%
  // of the transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: env.nodeEnv === 'production' ? 0.1 : 1.0,
  
  // ...
  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps
  
  environment: env.nodeEnv,
  
  beforeSend(event, hint) {
    // Filter out development errors
    if (env.nodeEnv === 'development') {
      console.log('Sentry Server Event:', event);
      console.log('Sentry Server Hint:', hint);
    }
    
    // Don't send events for certain errors
    if (event.exception) {
      const error = hint.originalException;
      
      // Filter out database connection errors that are temporary
      if (error instanceof Error) {
        if (error.message.includes('Connection terminated') || 
            error.message.includes('Connection timeout')) {
          return null;
        }
      }
    }
    
    return event;
  },
  
  // Performance monitoring
  profilesSampleRate: env.nodeEnv === 'production' ? 0.1 : 1.0,
  
  // Server-specific configuration
  ignoreErrors: [
    // Database connection issues that are temporary
    'Connection terminated',
    'Connection timeout',
    'ECONNRESET',
    'ENOTFOUND',
    // Next.js specific errors that are not actionable
    'NEXT_NOT_FOUND',
    'NEXT_REDIRECT',
  ],
});
