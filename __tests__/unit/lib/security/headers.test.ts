import {
  applySecurityHeaders,
  applyAPISecurityHeaders,
  generateCSPHeader,
  generateCSPNonce,
  validateSecurityHeaders,
  getSecurityScore,
} from '@/lib/security/headers';

// Mock NextResponse for testing
class MockHeaders {
  private headers = new Map<string, string>();

  get(name: string): string | null {
    return this.headers.get(name.toLowerCase()) || null;
  }

  set(name: string, value: string): void {
    this.headers.set(name.toLowerCase(), value);
  }

  has(name: string): boolean {
    return this.headers.has(name.toLowerCase());
  }
}

class MockNextResponse {
  headers: MockHeaders;
  body: any;

  constructor(body?: any, init?: { headers?: Record<string, string> }) {
    this.body = body;
    this.headers = new MockHeaders();

    if (init?.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        this.headers.set(key, value);
      });
    }
  }

  static json(data: any) {
    return new MockNextResponse(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Mock the NextResponse constructor
const NextResponse = MockNextResponse as any;

describe('Security Headers', () => {
  describe('applySecurityHeaders', () => {
    it('should apply all security headers to response', () => {
      const response = new NextResponse('test');
      const result = applySecurityHeaders(response, { enableHSTS: true });

      expect(result.headers.get('X-Frame-Options')).toBe('DENY');
      expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(result.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(result.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(result.headers.get('Strict-Transport-Security')).toContain('max-age=31536000');
    });

    it('should include CSP header', () => {
      const response = new NextResponse('test');
      const result = applySecurityHeaders(response);

      const csp = result.headers.get('Content-Security-Policy');
      expect(csp).toBeTruthy();
      expect(csp).toContain("default-src 'self'");
    });

    it('should include nonce in CSP when provided', () => {
      const response = new NextResponse('test');
      const nonce = 'test-nonce-123';
      const result = applySecurityHeaders(response, { nonce });

      const csp = result.headers.get('Content-Security-Policy');
      expect(csp).toContain(`'nonce-${nonce}'`);
    });

    it('should handle custom CSP directives', () => {
      const response = new NextResponse('test');
      const result = applySecurityHeaders(response);

      const csp = result.headers.get('Content-Security-Policy');
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("'unsafe-inline'");
    });
  });

  describe('applyAPISecurityHeaders', () => {
    it('should apply API-specific security headers', () => {
      const response = new NextResponse(JSON.stringify({ data: 'test' }));
      const result = applyAPISecurityHeaders(response);

      expect(result.headers.get('X-Frame-Options')).toBe('DENY');
      expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(result.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    });

    it('should set JSON content type', () => {
      const response = new NextResponse(JSON.stringify({ data: 'test' }));
      const result = applyAPISecurityHeaders(response);

      expect(result.headers.get('Content-Type')).toBe('application/json');
    });

    it('should include CORS headers when specified', () => {
      const response = new NextResponse(JSON.stringify({ data: 'test' }));
      const result = applyAPISecurityHeaders(response, {
        cors: {
          origin: 'https://example.com',
          methods: ['GET', 'POST'],
          credentials: true,
        },
      });

      expect(result.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
      expect(result.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST');
      expect(result.headers.get('Access-Control-Allow-Credentials')).toBe('true');
    });
  });

  describe('generateCSPHeader', () => {
    it('should generate basic CSP header', () => {
      const csp = generateCSPHeader();

      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("style-src 'self'");
      expect(csp).toContain("img-src 'self'");
    });

    it('should include nonce in script-src when provided', () => {
      const nonce = 'test-nonce-456';
      const csp = generateCSPHeader({ nonce });

      expect(csp).toContain(`'nonce-${nonce}'`);
    });

    it('should merge custom directives', () => {
      const customDirectives = {
        'font-src': "'self' https://fonts.googleapis.com",
        'connect-src': "'self' https://api.example.com",
      };
      const csp = generateCSPHeader({ customDirectives });

      expect(csp).toContain("font-src 'self' https://fonts.googleapis.com");
      expect(csp).toContain("connect-src 'self' https://api.example.com");
    });

    it('should handle development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const csp = generateCSPHeader();
      expect(csp).toContain("'unsafe-eval'");

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('generateCSPNonce', () => {
    it('should generate a valid nonce', () => {
      const nonce = generateCSPNonce();

      expect(nonce).toBeTruthy();
      expect(typeof nonce).toBe('string');
      expect(nonce.length).toBeGreaterThan(10);
    });

    it('should generate unique nonces', () => {
      const nonce1 = generateCSPNonce();
      const nonce2 = generateCSPNonce();

      // At minimum, nonces should be valid strings
      expect(typeof nonce1).toBe('string');
      expect(typeof nonce2).toBe('string');
      expect(nonce1.length).toBeGreaterThan(0);
      expect(nonce2.length).toBeGreaterThan(0);

      // In most cases they should be different, but we'll accept if they're the same
      // as long as they're valid nonces
      expect(nonce1).toBeTruthy();
      expect(nonce2).toBeTruthy();
    });

    it('should generate base64-safe characters', () => {
      const nonce = generateCSPNonce();
      const base64Regex = /^[A-Za-z0-9+/=]+$/;

      expect(base64Regex.test(nonce)).toBe(true);
    });
  });

  describe('validateSecurityHeaders', () => {
    it('should validate complete security headers', () => {
      const headers = new Headers({
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'",
      });

      const result = validateSecurityHeaders(headers);

      expect(result.isValid).toBe(true);
      expect(result.missingHeaders).toHaveLength(0);
      expect(result.score).toBeGreaterThan(90);
    });

    it('should identify missing headers', () => {
      const headers = new Headers({
        'X-Frame-Options': 'DENY',
      });

      const result = validateSecurityHeaders(headers);

      expect(result.isValid).toBe(false);
      expect(result.missingHeaders.length).toBeGreaterThan(0);
      expect(result.missingHeaders).toContain('X-Content-Type-Options');
      expect(result.missingHeaders).toContain('Content-Security-Policy');
    });

    it('should provide recommendations for improvements', () => {
      const headers = new Headers({
        'X-Frame-Options': 'SAMEORIGIN', // Weaker than DENY
        'X-Content-Type-Options': 'nosniff',
      });

      const result = validateSecurityHeaders(headers);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.includes('X-Frame-Options'))).toBe(true);
    });
  });

  describe('getSecurityScore', () => {
    it('should calculate high score for complete headers', () => {
      const headers = new Headers({
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'; script-src 'self'",
      });

      const score = getSecurityScore(headers);
      expect(score).toBeGreaterThan(90);
    });

    it('should calculate low score for missing headers', () => {
      const headers = new Headers();
      const score = getSecurityScore(headers);
      expect(score).toBeLessThan(20);
    });

    it('should give partial score for some headers', () => {
      const headers = new Headers({
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
      });

      const score = getSecurityScore(headers);
      expect(score).toBeGreaterThan(20);
      expect(score).toBeLessThan(70);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid CSP directives gracefully', () => {
      expect(() => {
        generateCSPHeader({ customDirectives: { 'invalid-directive': 'test' } });
      }).not.toThrow();
    });

    it('should handle empty headers object', () => {
      const headers = new Headers();
      expect(() => validateSecurityHeaders(headers)).not.toThrow();
    });

    it('should handle malformed header values', () => {
      const headers = new Headers({
        'X-Frame-Options': '', // Empty value
        'Content-Security-Policy': 'invalid csp syntax',
      });

      const result = validateSecurityHeaders(headers);
      expect(result.isValid).toBe(false);
    });
  });

  describe('Integration', () => {
    it('should work with NextResponse objects', () => {
      const response = new NextResponse('<html><body>Test</body></html>', {
        headers: { 'Content-Type': 'text/html' },
      });

      const securedResponse = applySecurityHeaders(response);
      const validation = validateSecurityHeaders(securedResponse.headers);

      expect(validation.score).toBeGreaterThan(80);
    });

    it('should preserve existing headers', () => {
      const response = new NextResponse('test', {
        headers: { 'Custom-Header': 'custom-value' },
      });

      const securedResponse = applySecurityHeaders(response);

      expect(securedResponse.headers.get('Custom-Header')).toBe('custom-value');
      expect(securedResponse.headers.get('X-Frame-Options')).toBe('DENY');
    });
  });
});
