import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Set tracesSampleRate to 1.0 to capture 100%
  // of the transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // ...
  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps
  
  environment: process.env.NODE_ENV || 'development',
  
  beforeSend(event, hint) {
    // Filter out development errors
    if (process.env.NODE_ENV === 'development') {
      console.log('Sentry Edge Event:', event);
      console.log('Sentry Edge Hint:', hint);
    }
    
    return event;
  },
  
  // Edge runtime specific configuration
  ignoreErrors: [
    // Edge runtime specific errors
    'Dynamic Code Evaluation',
    'WebAssembly',
  ],
});
