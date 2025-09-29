import { generateCSRFToken, verifyCSRFToken, validateCSRFToken } from '@/lib/security/csrf';

// Mock environment
process.env.CSRF_SECRET = 'test-csrf-secret';

// Mock NextRequest for testing
const createMockRequest = (
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
    body?: string;
  } = {}
) => {
  const { method = 'GET', headers = {}, cookies = {}, body } = options;

  // Normalize headers to lowercase for case-insensitive lookup
  const normalizedHeaders: Record<string, string> = {};
  Object.entries(headers).forEach(([key, value]) => {
    normalizedHeaders[key.toLowerCase()] = value;
  });

  const mockHeaders = {
    get: (name: string) => normalizedHeaders[name.toLowerCase()] || null,
  };

  const mockCookies = {
    get: (name: string) => cookies[name] ? { value: cookies[name] } : undefined,
  };

  // Parse URL to get pathname
  const urlObj = new URL(url);

  return {
    url,
    method,
    headers: mockHeaders,
    cookies: mockCookies,
    nextUrl: {
      pathname: urlObj.pathname,
    },
    body,
  } as any;
};

describe('CSRF Protection', () => {
  describe('generateCSRFToken', () => {
    it('should generate a valid CSRF token', () => {
      const { token, hash, timestamp } = generateCSRFToken();
      
      expect(token).toBeDefined();
      expect(hash).toBeDefined();
      expect(timestamp).toBeDefined();
      expect(typeof token).toBe('string');
      expect(typeof hash).toBe('string');
      expect(typeof timestamp).toBe('number');
      expect(token.length).toBe(64); // 32 bytes as hex
    });

    it('should generate unique tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      
      expect(token1.token).not.toBe(token2.token);
      expect(token1.hash).not.toBe(token2.hash);
    });
  });

  describe('verifyCSRFToken', () => {
    it('should verify valid tokens', () => {
      const { token, hash, timestamp } = generateCSRFToken();
      const isValid = verifyCSRFToken(token, hash, timestamp);
      
      expect(isValid).toBe(true);
    });

    it('should reject tokens with wrong hash', () => {
      const { token, timestamp } = generateCSRFToken();
      const wrongHash = 'wrong-hash';
      const isValid = verifyCSRFToken(token, wrongHash, timestamp);
      
      expect(isValid).toBe(false);
    });

    it('should reject expired tokens', () => {
      const { token, hash } = generateCSRFToken();
      const expiredTimestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
      const isValid = verifyCSRFToken(token, hash, expiredTimestamp);
      
      expect(isValid).toBe(false);
    });

    it('should handle invalid input gracefully', () => {
      expect(verifyCSRFToken('', '', 0)).toBe(false);
      expect(verifyCSRFToken('invalid', 'invalid', Date.now())).toBe(false);
    });
  });

  describe('validateCSRFToken', () => {
    it('should allow GET requests without CSRF token', () => {
      const request = createMockRequest('http://localhost:3000/api/test', {
        method: 'GET',
      });
      
      const isValid = validateCSRFToken(request);
      expect(isValid).toBe(true);
    });

    it('should allow HEAD requests without CSRF token', () => {
      const request = createMockRequest('http://localhost:3000/api/test', {
        method: 'HEAD',
      });
      
      const isValid = validateCSRFToken(request);
      expect(isValid).toBe(true);
    });

    it('should allow OPTIONS requests without CSRF token', () => {
      const request = createMockRequest('http://localhost:3000/api/test', {
        method: 'OPTIONS',
      });
      
      const isValid = validateCSRFToken(request);
      expect(isValid).toBe(true);
    });

    it('should allow exempt routes without CSRF token', () => {
      const request = createMockRequest('http://localhost:3000/api/auth/callback', {
        method: 'POST',
      });
      
      const isValid = validateCSRFToken(request);
      expect(isValid).toBe(true);
    });

    it('should reject POST requests without CSRF token', () => {
      const request = createMockRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: 'test' }),
      });
      
      const isValid = validateCSRFToken(request);
      expect(isValid).toBe(false);
    });

    it('should validate POST requests with valid CSRF token', () => {
      const { token, hash, timestamp } = generateCSRFToken();
      
      // Create cookie value
      const cookieValue = JSON.stringify({ token, hash, timestamp });
      
      const request = createMockRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        cookies: {
          'csrf-token': cookieValue,
        },
        body: JSON.stringify({ content: 'test' }),
      });
      
      const isValid = validateCSRFToken(request);
      expect(isValid).toBe(true);
    });

    it('should reject POST requests with invalid CSRF token', () => {
      const { token, hash, timestamp } = generateCSRFToken();
      
      // Create cookie value
      const cookieValue = JSON.stringify({ token, hash, timestamp });
      
      const request = createMockRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'wrong-token',
          'Cookie': `csrf-token=${encodeURIComponent(cookieValue)}`,
        },
        body: JSON.stringify({ content: 'test' }),
      });
      
      const isValid = validateCSRFToken(request);
      expect(isValid).toBe(false);
    });

    it('should reject POST requests with expired CSRF token', () => {
      const { token, hash } = generateCSRFToken();
      const expiredTimestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
      
      // Create cookie value with expired timestamp
      const cookieValue = JSON.stringify({ token, hash, timestamp: expiredTimestamp });
      
      const request = createMockRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
          'Cookie': `csrf-token=${encodeURIComponent(cookieValue)}`,
        },
        body: JSON.stringify({ content: 'test' }),
      });
      
      const isValid = validateCSRFToken(request);
      expect(isValid).toBe(false);
    });

    it('should handle malformed cookie gracefully', () => {
      const request = createMockRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'some-token',
          'Cookie': 'csrf-token=invalid-json',
        },
        body: JSON.stringify({ content: 'test' }),
      });
      
      const isValid = validateCSRFToken(request);
      expect(isValid).toBe(false);
    });

    it('should allow development bypass when enabled', () => {
      // Mock development environment
      const originalEnv = process.env.NODE_ENV;
      const originalDisable = process.env.DISABLE_CSRF;
      
      process.env.NODE_ENV = 'development';
      process.env.DISABLE_CSRF = 'true';
      
      const request = createMockRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: 'test' }),
      });
      
      const isValid = validateCSRFToken(request);
      expect(isValid).toBe(true);
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
      process.env.DISABLE_CSRF = originalDisable;
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing cookies', () => {
      const request = createMockRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'some-token',
        },
        body: JSON.stringify({ content: 'test' }),
      });
      
      const isValid = validateCSRFToken(request);
      expect(isValid).toBe(false);
    });

    it('should handle missing header token', () => {
      const { token, hash, timestamp } = generateCSRFToken();
      const cookieValue = JSON.stringify({ token, hash, timestamp });
      
      const request = createMockRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `csrf-token=${encodeURIComponent(cookieValue)}`,
        },
        body: JSON.stringify({ content: 'test' }),
      });
      
      const isValid = validateCSRFToken(request);
      expect(isValid).toBe(false);
    });

    it('should handle empty token values', () => {
      const cookieValue = JSON.stringify({ token: '', hash: '', timestamp: Date.now() });
      
      const request = createMockRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': '',
          'Cookie': `csrf-token=${encodeURIComponent(cookieValue)}`,
        },
        body: JSON.stringify({ content: 'test' }),
      });
      
      const isValid = validateCSRFToken(request);
      expect(isValid).toBe(false);
    });

    it('should handle different HTTP methods correctly', () => {
      const methods = ['PUT', 'PATCH', 'DELETE'];
      
      methods.forEach(method => {
        const request = createMockRequest('http://localhost:3000/api/posts', {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: 'test' }),
        });
        
        const isValid = validateCSRFToken(request);
        expect(isValid).toBe(false);
      });
    });
  });
});
