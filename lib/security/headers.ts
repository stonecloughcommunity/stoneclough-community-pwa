import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/config/environment';

export interface SecurityHeadersConfig {
  enableCSP?: boolean;
  enableHSTS?: boolean;
  enableXSSProtection?: boolean;
  enableContentTypeOptions?: boolean;
  enableReferrerPolicy?: boolean;
  enablePermissionsPolicy?: boolean;
  reportOnly?: boolean;
  nonce?: string;
}

// Generate a random nonce for CSP
export function generateNonce(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      // Browser environment
      return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');
    } else {
      // Node.js environment
      const nodeCrypto = require('crypto');
      return nodeCrypto.randomBytes(16).toString('base64');
    }
  } catch (error) {
    // Fallback for test environments - ensure uniqueness
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return Buffer.from(timestamp + random).toString('base64');
  }
}

// Build Content Security Policy
export function buildCSP(config: SecurityHeadersConfig = {}): string {
  const { nonce, reportOnly = false } = config;
  
  // Base CSP directives
  const directives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-eval'", // Required for Next.js in development
      "'unsafe-inline'", // Required for some third-party scripts
      nonce ? `'nonce-${nonce}'` : null,
      'https://vercel.live',
      'https://va.vercel-scripts.com',
      'https://vitals.vercel-insights.com',
      'https://browser.sentry-cdn.com',
      'https://js.sentry-cdn.com',
    ].filter(Boolean),
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for CSS-in-JS and some components
      'https://fonts.googleapis.com',
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'data:', // For base64 encoded fonts
    ],
    'img-src': [
      "'self'",
      'data:', // For base64 images and SVGs
      'blob:', // For generated images
      'https:', // Allow HTTPS images
      'https://res.cloudinary.com', // Cloudinary CDN
      'https://images.unsplash.com', // Unsplash images
      'https://via.placeholder.com', // Placeholder images
    ],
    'media-src': [
      "'self'",
      'https:', // Allow HTTPS media
      'blob:', // For generated media
    ],
    'connect-src': [
      "'self'",
      'https:', // Allow HTTPS connections
      'wss:', // WebSocket connections
      env.supabaseUrl,
      'https://vitals.vercel-insights.com',
      'https://vercel.live',
      'https://o4507902800748544.ingest.us.sentry.io', // Sentry DSN
    ],
    'frame-src': [
      "'self'",
      'https://vercel.live',
    ],
    'worker-src': [
      "'self'",
      'blob:', // For service workers
    ],
    'manifest-src': ["'self'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"], // Prevent clickjacking
    'object-src': ["'none'"], // Prevent object/embed/applet
    'upgrade-insecure-requests': [], // Upgrade HTTP to HTTPS
    'report-uri': [`${env.appUrl}/api/security/csp-report`], // CSP violation reporting
  };

  // Convert directives to CSP string
  const cspString = Object.entries(directives)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive;
      }
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');

  return cspString;
}

// Build Permissions Policy (formerly Feature Policy)
export function buildPermissionsPolicy(): string {
  const policies = [
    'camera=(self)', // Allow camera access for the app
    'microphone=(self)', // Allow microphone access
    'geolocation=(self)', // Allow location access
    'notifications=(self)', // Allow notifications
    'push=(self)', // Allow push notifications
    'accelerometer=()', // Disable accelerometer
    'ambient-light-sensor=()', // Disable ambient light sensor
    'autoplay=()', // Disable autoplay
    'battery=()', // Disable battery API
    'display-capture=()', // Disable screen capture
    'document-domain=()', // Disable document.domain
    'encrypted-media=()', // Disable encrypted media
    'fullscreen=(self)', // Allow fullscreen for the app
    'gyroscope=()', // Disable gyroscope
    'magnetometer=()', // Disable magnetometer
    'midi=()', // Disable MIDI
    'payment=()', // Disable payment API
    'picture-in-picture=()', // Disable picture-in-picture
    'publickey-credentials-get=(self)', // Allow WebAuthn
    'screen-wake-lock=(self)', // Allow wake lock for the app
    'sync-xhr=()', // Disable synchronous XHR
    'usb=()', // Disable USB API
    'web-share=(self)', // Allow web share API
    'xr-spatial-tracking=()', // Disable XR tracking
  ];

  return policies.join(', ');
}

// Apply security headers to response
export function applySecurityHeaders(
  response: NextResponse,
  config: SecurityHeadersConfig = {}
): NextResponse {
  const {
    enableCSP = true,
    enableHSTS = env.nodeEnv === 'production',
    enableXSSProtection = true,
    enableContentTypeOptions = true,
    enableReferrerPolicy = true,
    enablePermissionsPolicy = true,
    reportOnly = false,
    nonce,
  } = config;

  // Content Security Policy
  if (enableCSP) {
    const csp = buildCSP({ nonce, reportOnly });
    const headerName = reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
    response.headers.set(headerName, csp);
  }

  // HTTP Strict Transport Security (HTTPS only)
  if (enableHSTS) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // X-XSS-Protection (legacy but still useful)
  if (enableXSSProtection) {
    response.headers.set('X-XSS-Protection', '1; mode=block');
  }

  // X-Content-Type-Options
  if (enableContentTypeOptions) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
  }

  // Referrer Policy
  if (enableReferrerPolicy) {
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  }

  // Permissions Policy
  if (enablePermissionsPolicy) {
    response.headers.set('Permissions-Policy', buildPermissionsPolicy());
  }

  // X-Frame-Options (backup for CSP frame-ancestors)
  response.headers.set('X-Frame-Options', 'DENY');

  // X-DNS-Prefetch-Control
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  // Cross-Origin-Embedder-Policy
  response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');

  // Cross-Origin-Opener-Policy
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

  // Cross-Origin-Resource-Policy
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  return response;
}

// Middleware function to apply security headers
export function withSecurityHeaders(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: SecurityHeadersConfig = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const response = await handler(request);
    return applySecurityHeaders(response, config);
  };
}

// Security headers for API routes
export function applyAPISecurityHeaders(
  response: NextResponse,
  options: {
    cors?: {
      origin?: string;
      methods?: string[];
      credentials?: boolean;
    };
  } = {}
): NextResponse {
  // API-specific security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Prevent caching of sensitive API responses
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  // Set JSON content type for API responses
  if (!response.headers.get('Content-Type')) {
    response.headers.set('Content-Type', 'application/json');
  }

  // Apply CORS headers if specified
  if (options.cors) {
    const { origin, methods, credentials } = options.cors;

    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }

    if (methods) {
      response.headers.set('Access-Control-Allow-Methods', methods.join(', '));
    }

    if (credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
  } else {
    // Default CORS headers
    response.headers.set('Access-Control-Allow-Origin', env.appUrl);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, X-CSRF-Token'
    );
  }

  return response;
}

// Check if request is from allowed origin
export function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  const allowedOrigins = [
    env.appUrl,
    'http://localhost:3000',
    'http://localhost:3001',
    'https://stoneclough.uk',
    'https://www.stoneclough.uk',
  ];

  if (origin && allowedOrigins.includes(origin)) {
    return true;
  }

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      return allowedOrigins.includes(refererUrl.origin);
    } catch {
      return false;
    }
  }

  return false;
}

// Validate Content-Type for API requests
export function validateContentType(request: NextRequest, expectedTypes: string[]): boolean {
  const contentType = request.headers.get('content-type');
  
  if (!contentType) {
    return false;
  }

  return expectedTypes.some(type => contentType.includes(type));
}

// Security headers configuration for different environments
export const securityConfig = {
  development: {
    enableCSP: false, // Disabled in dev for easier debugging
    enableHSTS: false,
    enableXSSProtection: true,
    enableContentTypeOptions: true,
    enableReferrerPolicy: true,
    enablePermissionsPolicy: false, // Can be restrictive in dev
    reportOnly: true,
  },
  production: {
    enableCSP: true,
    enableHSTS: true,
    enableXSSProtection: true,
    enableContentTypeOptions: true,
    enableReferrerPolicy: true,
    enablePermissionsPolicy: true,
    reportOnly: false,
  },
  test: {
    enableCSP: false,
    enableHSTS: false,
    enableXSSProtection: false,
    enableContentTypeOptions: false,
    enableReferrerPolicy: false,
    enablePermissionsPolicy: false,
    reportOnly: false,
  },
};

// Get security config for current environment
export function getSecurityConfig(): SecurityHeadersConfig {
  return securityConfig[env.nodeEnv] || securityConfig.production;
}

// Generate CSP header (alias for buildCSP)
export function generateCSPHeader(options: { nonce?: string; customDirectives?: Record<string, string> } = {}): string {
  const { nonce, customDirectives } = options;
  const config: SecurityHeadersConfig = { nonce };

  let csp = buildCSP(config);

  // Merge custom directives if provided
  if (customDirectives) {
    const directives = csp.split(';').map(d => d.trim());
    const directiveMap = new Map<string, string>();

    // Parse existing directives
    directives.forEach(directive => {
      const [key, ...values] = directive.split(' ');
      if (key) {
        directiveMap.set(key, values.join(' '));
      }
    });

    // Add/override with custom directives
    Object.entries(customDirectives).forEach(([key, value]) => {
      directiveMap.set(key, value);
    });

    // Rebuild CSP string
    csp = Array.from(directiveMap.entries())
      .map(([key, value]) => `${key} ${value}`)
      .join('; ');
  }

  return csp;
}

// Generate CSP nonce (alias for generateNonce)
export function generateCSPNonce(): string {
  return generateNonce();
}

// Validate security headers
export function validateSecurityHeaders(headers: Headers): {
  isValid: boolean;
  missingHeaders: string[];
  recommendations: string[];
  score: number;
} {
  const requiredHeaders = [
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Referrer-Policy',
    'X-XSS-Protection',
    'Strict-Transport-Security',
    'Content-Security-Policy',
  ];

  const missingHeaders: string[] = [];
  const recommendations: string[] = [];

  requiredHeaders.forEach(header => {
    if (!headers.get(header)) {
      missingHeaders.push(header);
    }
  });

  // Check for weak configurations
  const frameOptions = headers.get('X-Frame-Options');
  if (frameOptions && frameOptions !== 'DENY') {
    recommendations.push('Consider using X-Frame-Options: DENY for maximum protection');
  }

  const csp = headers.get('Content-Security-Policy');
  if (csp && csp.includes("'unsafe-inline'")) {
    recommendations.push('Avoid using unsafe-inline in Content-Security-Policy');
  }

  const score = getSecurityScore(headers);
  const isValid = missingHeaders.length === 0 && score >= 80;

  return {
    isValid,
    missingHeaders,
    recommendations,
    score,
  };
}

// Calculate security score based on headers
export function getSecurityScore(headers: Headers): number {
  const headerScores = {
    'X-Frame-Options': 15,
    'X-Content-Type-Options': 10,
    'Referrer-Policy': 10,
    'X-XSS-Protection': 10,
    'Strict-Transport-Security': 20,
    'Content-Security-Policy': 25,
    'Permissions-Policy': 10,
  };

  let score = 0;

  Object.entries(headerScores).forEach(([header, points]) => {
    const value = headers.get(header);
    if (value) {
      score += points;

      // Bonus points for strong configurations
      if (header === 'X-Frame-Options' && value === 'DENY') {
        score += 5;
      }
      if (header === 'Strict-Transport-Security' && value.includes('includeSubDomains')) {
        score += 5;
      }
      if (header === 'Content-Security-Policy' && !value.includes("'unsafe-inline'")) {
        score += 5;
      }
    }
  });

  return Math.min(score, 100);
}
