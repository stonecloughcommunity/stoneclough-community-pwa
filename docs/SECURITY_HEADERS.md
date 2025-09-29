# Security Headers Implementation

This document describes the comprehensive security headers implementation in the Stoneclough Community PWA.

## Overview

The application implements multiple layers of security headers to protect against common web vulnerabilities including XSS, clickjacking, CSRF, and data injection attacks.

## Implemented Security Headers

### 1. Content Security Policy (CSP)

**Purpose**: Prevents XSS attacks by controlling which resources can be loaded and executed.

**Implementation**:
```typescript
'Content-Security-Policy': [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https: wss: [supabase-url]",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
  "report-uri /api/security/csp-report"
].join('; ')
```

**Features**:
- Blocks inline scripts and styles (with exceptions for necessary functionality)
- Prevents loading of external resources from untrusted domains
- Automatic violation reporting to `/api/security/csp-report`
- Nonce-based script execution for dynamic content

### 2. HTTP Strict Transport Security (HSTS)

**Purpose**: Enforces HTTPS connections and prevents protocol downgrade attacks.

**Implementation**:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**Features**:
- 1-year max-age for long-term HTTPS enforcement
- Includes all subdomains
- Preload list eligible for browser built-in HSTS

### 3. X-Frame-Options

**Purpose**: Prevents clickjacking attacks by controlling iframe embedding.

**Implementation**:
```
X-Frame-Options: DENY
```

**Features**:
- Completely prevents the page from being embedded in frames
- Backup protection for CSP frame-ancestors directive

### 4. X-Content-Type-Options

**Purpose**: Prevents MIME type sniffing attacks.

**Implementation**:
```
X-Content-Type-Options: nosniff
```

**Features**:
- Forces browsers to respect declared content types
- Prevents execution of non-executable MIME types

### 5. X-XSS-Protection

**Purpose**: Enables browser XSS filtering (legacy support).

**Implementation**:
```
X-XSS-Protection: 1; mode=block
```

**Features**:
- Enables XSS filtering in older browsers
- Blocks page rendering when XSS is detected

### 6. Referrer Policy

**Purpose**: Controls referrer information sent with requests.

**Implementation**:
```
Referrer-Policy: strict-origin-when-cross-origin
```

**Features**:
- Sends full referrer for same-origin requests
- Sends only origin for cross-origin HTTPS requests
- No referrer for HTTPS to HTTP requests

### 7. Permissions Policy

**Purpose**: Controls browser feature access and API usage.

**Implementation**:
```typescript
'Permissions-Policy': [
  'camera=(self)',
  'microphone=(self)',
  'geolocation=(self)',
  'notifications=(self)',
  'push=(self)',
  'accelerometer=()',
  'ambient-light-sensor=()',
  'autoplay=()',
  'battery=()',
  'display-capture=()',
  'document-domain=()',
  'encrypted-media=()',
  'fullscreen=(self)',
  'gyroscope=()',
  'magnetometer=()',
  'midi=()',
  'payment=()',
  'picture-in-picture=()',
  'publickey-credentials-get=(self)',
  'screen-wake-lock=(self)',
  'sync-xhr=()',
  'usb=()',
  'web-share=(self)',
  'xr-spatial-tracking=()'
].join(', ')
```

**Features**:
- Allows necessary features for PWA functionality
- Blocks potentially dangerous APIs
- Granular control over browser capabilities

### 8. Cross-Origin Policies

**Purpose**: Enhanced isolation and security for cross-origin interactions.

**Implementation**:
```
Cross-Origin-Embedder-Policy: credentialless
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
```

**Features**:
- Prevents cross-origin resource access
- Isolates browsing contexts
- Enhanced security for SharedArrayBuffer usage

## Architecture

### Header Application Flow

1. **Middleware Level**: Primary security headers applied via Next.js middleware
2. **Next.js Config**: Fallback headers for static assets and API routes
3. **API Routes**: Specific headers for API endpoints

### Environment-Specific Configuration

```typescript
const securityConfig = {
  development: {
    enableCSP: false,        // Disabled for easier debugging
    enableHSTS: false,       // No HTTPS in development
    reportOnly: true,        // CSP violations logged but not blocked
  },
  production: {
    enableCSP: true,         // Full CSP enforcement
    enableHSTS: true,        // HTTPS enforcement
    reportOnly: false,       // CSP violations blocked
  }
}
```

## Monitoring and Reporting

### CSP Violation Reporting

- **Endpoint**: `/api/security/csp-report`
- **Processing**: Automatic filtering of false positives
- **Logging**: Critical violations logged to Sentry
- **Analysis**: Violations categorized by severity

### Security Audit Dashboard

- **Location**: `/admin/security`
- **Features**: 
  - Real-time security score calculation
  - Header presence validation
  - Recommendation engine
  - Historical audit tracking

### Automated Monitoring

- **Header Validation**: Every request validates security headers
- **Violation Tracking**: CSP violations automatically logged
- **Performance Impact**: Minimal overhead with efficient header application
- **Alert System**: Critical security issues trigger immediate alerts

## Best Practices

### Development

1. **Test CSP Changes**: Use report-only mode first
2. **Validate Headers**: Use security audit dashboard
3. **Monitor Violations**: Check CSP reports regularly
4. **Update Allowlists**: Keep CSP directives minimal

### Production

1. **Regular Audits**: Run security audits weekly
2. **Monitor Reports**: Review CSP violation reports
3. **Update Headers**: Keep headers current with security best practices
4. **Performance Testing**: Ensure headers don't impact performance

## Troubleshooting

### Common Issues

1. **CSP Violations**
   - Check browser console for violation details
   - Review CSP report endpoint logs
   - Adjust directives as needed

2. **HSTS Issues**
   - Ensure HTTPS is properly configured
   - Check certificate validity
   - Verify subdomain coverage

3. **Frame Options Conflicts**
   - CSP frame-ancestors takes precedence
   - Ensure consistent policies

### Debug Mode

Enable detailed logging in development:

```typescript
const config = {
  ...getSecurityConfig(),
  reportOnly: true,  // Log violations without blocking
  nonce: generateNonce()  // Enable nonce-based CSP
}
```

## Compliance

### Security Standards

- **OWASP**: Follows OWASP security header recommendations
- **Mozilla Observatory**: A+ rating target
- **Security Headers**: 100% score target
- **CSP Level 3**: Modern CSP directive support

### Privacy Compliance

- **GDPR**: Headers support privacy-first design
- **Data Minimization**: Minimal referrer information sharing
- **User Consent**: Permissions policy respects user choices

## Performance Impact

### Optimization

- **Header Caching**: Headers cached at CDN level
- **Minimal Overhead**: Efficient header application
- **Compression**: Headers compressed in transit
- **Bundle Impact**: No JavaScript bundle size increase

### Monitoring

- **Core Web Vitals**: Headers don't impact CWV scores
- **Load Times**: Negligible impact on page load
- **Network Overhead**: Minimal additional bytes
- **Browser Processing**: Efficient header parsing

## Future Enhancements

### Planned Improvements

1. **CSP Level 3**: Implement strict-dynamic and trusted-types
2. **Reporting API**: Migrate to modern Reporting API
3. **Certificate Transparency**: Add Expect-CT header
4. **Feature Detection**: Dynamic permissions policy

### Integration Opportunities

1. **WAF Integration**: Coordinate with Web Application Firewall
2. **CDN Headers**: Optimize header delivery via CDN
3. **Monitoring Tools**: Enhanced integration with security tools
4. **Automation**: Automated header testing and validation
