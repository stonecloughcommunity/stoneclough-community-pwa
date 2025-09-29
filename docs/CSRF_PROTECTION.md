# CSRF Protection Implementation

This document describes the comprehensive Cross-Site Request Forgery (CSRF) protection implementation in the Stoneclough Community PWA.

## Overview

CSRF protection prevents malicious websites from making unauthorized requests on behalf of authenticated users. Our implementation uses double-submit cookies with cryptographic verification and timing-safe comparisons.

## Architecture

### Server-Side Components

1. **CSRF Token Generation** (`lib/security/csrf.ts`)
   - Cryptographically secure token generation
   - Token hashing with secret and timestamp
   - Timing-safe token verification

2. **CSRF Middleware** (`lib/security/csrf-middleware.ts`)
   - Request validation and protection
   - Route exemption handling
   - Error response generation

3. **API Endpoint** (`app/api/csrf-token/route.ts`)
   - Token distribution for client-side use
   - Exempt from CSRF protection for initial token generation

### Client-Side Components

1. **CSRF Client Utilities** (`lib/security/csrf-client.ts`)
   - React hooks for token management
   - Enhanced fetch wrapper with automatic token inclusion
   - Form submission helpers

2. **Token Storage and Retrieval**
   - LocalStorage for token persistence
   - Meta tag fallback for server-rendered tokens
   - Automatic token refresh on expiration

## Implementation Details

### Token Generation

```typescript
// Generate cryptographically secure token
const token = randomBytes(32).toString('hex');
const timestamp = Date.now();
const hash = createHash('sha256')
  .update(`${token}:${timestamp}:${secret}`)
  .digest('hex');
```

### Token Verification

```typescript
// Timing-safe comparison to prevent timing attacks
function verifyToken(token: string, secret: string, expectedHash: string): boolean {
  const computedHash = generateTokenHash(token, secret);
  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  const computedBuffer = Buffer.from(computedHash, 'hex');
  
  return expectedBuffer.length === computedBuffer.length && 
         timingSafeEqual(expectedBuffer, computedBuffer);
}
```

### Double-Submit Cookie Pattern

1. **Token Storage**: CSRF token stored in HTTP-only cookie
2. **Token Transmission**: Token sent in request header or form field
3. **Verification**: Server compares cookie token with request token

## Configuration

### Protected Methods
- POST
- PUT  
- PATCH
- DELETE

### Exempt Routes
- `/api/auth/callback` - OAuth callbacks
- `/api/webhooks/` - External webhooks
- `/api/health` - Health checks
- `/api/security/csp-report` - CSP violation reports
- `/api/csrf-token` - Token generation endpoint

### Token Settings
- **Length**: 32 bytes (64 hex characters)
- **Expiry**: 24 hours
- **Cookie Name**: `csrf-token`
- **Header Name**: `x-csrf-token`
- **Form Field**: `_csrf`

## Usage Examples

### Client-Side React Hook

```typescript
import { useCSRFToken } from '@/lib/security/csrf-client';

function MyComponent() {
  const { token, loading, error, refreshToken } = useCSRFToken();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div>CSRF Token: {token}</div>;
}
```

### Enhanced Fetch with CSRF

```typescript
import { csrfFetch } from '@/lib/security/csrf-client';

// Automatically includes CSRF token for protected methods
const response = await csrfFetch('/api/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ content: 'Hello world' }),
});
```

### Form Submission

```typescript
import { useCSRFForm } from '@/lib/security/csrf-client';

function ContactForm() {
  const { submitForm, loading } = useCSRFForm();
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const response = await submitForm(e.currentTarget);
      console.log('Form submitted successfully');
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="message" required />
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

### API Route Protection

```typescript
import { withCSRFProtection } from '@/lib/security/csrf-middleware';

export const POST = withCSRFProtection(async (request: NextRequest) => {
  // This handler is automatically protected by CSRF validation
  const data = await request.json();
  
  // Process the request...
  
  return NextResponse.json({ success: true });
});
```

## Security Features

### Timing Attack Prevention

Uses `timingSafeEqual()` for constant-time string comparison to prevent timing-based attacks that could reveal token information.

### Token Rotation

Tokens are automatically rotated after successful validation to prevent replay attacks and limit exposure window.

### Secure Cookie Configuration

```typescript
const cookieOptions = {
  httpOnly: false,     // Must be readable by JavaScript
  secure: true,        // HTTPS only in production
  sameSite: 'strict',  // Strict same-site policy
  maxAge: 86400,       // 24 hours
  path: '/',           // Available site-wide
};
```

### Error Handling

Comprehensive error responses with specific error codes:

- `CSRF_TOKEN_MISSING`: No token provided
- `CSRF_TOKEN_INVALID`: Token verification failed
- `CSRF_TOKEN_MISMATCH`: Cookie and header tokens don't match
- `CSRF_GENERATION_FAILED`: Server-side token generation error

## Monitoring and Logging

### Security Events

CSRF protection events are logged and monitored:

```typescript
// Logged events
- validation_failed: CSRF validation failed
- token_missing: Required token not provided
- token_invalid: Token verification failed
- protection_bypassed: Request exempt from protection
```

### Sentry Integration

Critical CSRF events are automatically reported to Sentry for security monitoring:

```typescript
captureMessage('CSRF Protection Event', 'warning', {
  tags: { type: 'csrf_protection', event: 'validation_failed' },
  extra: { method, pathname, userAgent, ip }
});
```

## Testing

### Unit Tests

```typescript
describe('CSRF Protection', () => {
  it('should generate valid tokens', () => {
    const { token, hash, timestamp } = generateCSRFToken();
    expect(verifyCSRFToken(token, hash, timestamp)).toBe(true);
  });
  
  it('should reject expired tokens', () => {
    const oldTimestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
    const { token, hash } = generateCSRFToken();
    expect(verifyCSRFToken(token, hash, oldTimestamp)).toBe(false);
  });
});
```

### Integration Tests

```typescript
describe('CSRF API Protection', () => {
  it('should block POST requests without CSRF token', async () => {
    const response = await fetch('/api/posts', {
      method: 'POST',
      body: JSON.stringify({ content: 'test' }),
    });
    
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      code: 'CSRF_TOKEN_MISSING'
    });
  });
});
```

## Troubleshooting

### Common Issues

1. **Token Missing Error**
   ```
   Error: CSRF token is required for this request
   ```
   - Ensure client is fetching token from `/api/csrf-token`
   - Check that token is included in request headers
   - Verify cookie is being set correctly

2. **Token Invalid Error**
   ```
   Error: Invalid CSRF token
   ```
   - Token may have expired (24-hour limit)
   - Check server-side secret configuration
   - Verify token hasn't been modified in transit

3. **Token Mismatch Error**
   ```
   Error: CSRF token mismatch
   ```
   - Cookie token differs from header token
   - Check for race conditions in token generation
   - Verify client is using latest token

### Debug Mode

Enable detailed CSRF logging in development:

```bash
NODE_ENV=development
CSRF_DEBUG=true
```

### Manual Token Verification

```typescript
// Check if token is valid
const isValid = verifyCSRFToken(token, hash, timestamp);
console.log('Token valid:', isValid);

// Get current token for debugging
const currentToken = getCSRFTokenForClient(request);
console.log('Current token:', currentToken);
```

## Performance Considerations

### Token Caching

- Tokens cached in localStorage for 24 hours
- Server-side token validation is O(1)
- Minimal performance impact on requests

### Memory Usage

- Tokens are stateless (no server-side storage)
- Cryptographic operations are lightweight
- No database queries required for validation

### Network Overhead

- Additional 64-byte header per protected request
- One-time token fetch on page load
- Automatic token refresh minimizes requests

## Compliance

### Security Standards

- **OWASP**: Follows OWASP CSRF prevention guidelines
- **Double-Submit Cookies**: Industry-standard pattern
- **Cryptographic Security**: Uses Node.js crypto module
- **Timing Attack Resistance**: Constant-time comparisons

### Privacy Considerations

- Tokens contain no personal information
- Automatic expiration limits exposure
- No tracking or analytics data collected

## Migration and Deployment

### Enabling CSRF Protection

1. **Deploy server-side changes**
2. **Update client-side code** to use CSRF utilities
3. **Test thoroughly** in staging environment
4. **Monitor** for CSRF-related errors after deployment

### Rollback Procedure

1. **Disable CSRF middleware** in emergency
2. **Set environment variable**: `DISABLE_CSRF=true`
3. **Redeploy** with CSRF disabled
4. **Investigate and fix** issues before re-enabling

### Gradual Rollout

```typescript
// Feature flag for gradual rollout
const csrfEnabled = process.env.CSRF_ENABLED === 'true' || 
                   Math.random() < parseFloat(process.env.CSRF_ROLLOUT_PERCENTAGE || '0');
```

## Future Enhancements

### Planned Improvements

1. **SameSite Cookie Enforcement**: Enhanced cookie security
2. **Token Binding**: Bind tokens to specific user sessions
3. **Rate Limiting**: Limit token generation requests
4. **Advanced Monitoring**: ML-based anomaly detection

### Integration Opportunities

1. **WAF Integration**: Coordinate with Web Application Firewall
2. **Bot Detection**: Enhanced protection against automated attacks
3. **User Behavior Analytics**: Detect suspicious patterns
4. **Compliance Reporting**: Automated security compliance reports
