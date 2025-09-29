import * as Sentry from "@sentry/nextjs";
import { env } from "@/lib/config/environment";

Sentry.init({
  dsn: env.sentryDsn,
  
  // Set tracesSampleRate to 1.0 to capture 100%
  // of the transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: env.nodeEnv === 'production' ? 0.1 : 1.0,
  
  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // ...
  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps
  
  environment: env.nodeEnv,
  
  beforeSend(event, hint) {
    // Filter out development errors
    if (env.nodeEnv === 'development') {
      console.log('Sentry Event:', event);
      console.log('Sentry Hint:', hint);
    }
    
    // Don't send events for certain errors
    if (event.exception) {
      const error = hint.originalException;
      
      // Filter out network errors that are not actionable
      if (error instanceof Error) {
        if (error.message.includes('Network Error') || 
            error.message.includes('Failed to fetch')) {
          return null;
        }
      }
    }
    
    return event;
  },
  
  integrations: [
    new Sentry.Replay({
      // Mask all text content, but not attributes
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Performance monitoring
  profilesSampleRate: env.nodeEnv === 'production' ? 0.1 : 1.0,
  
  // Additional configuration
  ignoreErrors: [
    // Random plugins/extensions
    'top.GLOBALS',
    // See: http://blog.errorception.com/2012/03/tale-of-unfindable-js-error.html
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    'http://tt.epicplay.com',
    "Can't find variable: ZiteReader",
    'jigsaw is not defined',
    'ComboSearch is not defined',
    'http://loading.retry.widdit.com/',
    'atomicFindClose',
    // Facebook borked
    'fb_xd_fragment',
    // ISP "optimizing" proxy - `Cache-Control: no-transform` seems to
    // reduce this. (thanks @acdha)
    // See http://stackoverflow.com/questions/4113268
    'bmi_SafeAddOnload',
    'EBCallBackMessageReceived',
    // See http://toolbar.conduit.com/Developer/HtmlAndGadget/Methods/JSInjection.aspx
    'conduitPage',
    // Generic error boundary messages
    'ChunkLoadError',
    'Loading chunk',
    'Loading CSS chunk',
  ],
  
  denyUrls: [
    // Facebook flakiness
    /graph\.facebook\.com/i,
    // Facebook blocked
    /connect\.facebook\.net\/en_US\/all\.js/i,
    // Woopra flakiness
    /eatdifferent\.com\.woopra-ns\.com/i,
    /static\.woopra\.com\/js\/woopra\.js/i,
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    // Other plugins
    /127\.0\.0\.1:4001\/isrunning/i,  // Cacaoweb
    /webappstoolbarba\.texthelp\.com\//i,
    /metrics\.itunes\.apple\.com\.edgesuite\.net\//i,
  ],
});
