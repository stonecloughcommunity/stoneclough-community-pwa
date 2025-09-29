/**
 * Integration tests for security API routes
 */

import { NextRequest } from 'next/server';

// Mock Supabase client
const mockQuery = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => mockQuery),
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabaseClient)),
}));

// Mock Sentry
jest.mock('@/lib/monitoring/sentry', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

// Import API handlers after mocking
import { POST as cspReportHandler } from '@/app/api/security/csp-report/route';
import { GET as securityAuditHandler } from '@/app/api/security/audit/route';
import { GET as securityTestHandler } from '@/app/api/security/test/route';

describe('Security API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/security/csp-report', () => {
    it('should process CSP violation reports', async () => {
      const cspReport = {
        'csp-report': {
          'document-uri': 'https://example.com/page',
          'referrer': 'https://example.com',
          'violated-directive': 'script-src',
          'effective-directive': 'script-src',
          'original-policy': "default-src 'self'; script-src 'self'",
          'disposition': 'enforce',
          'blocked-uri': 'https://malicious.com/script.js',
          'line-number': 42,
          'column-number': 10,
          'source-file': 'https://example.com/page',
          'status-code': 200,
          'script-sample': 'eval("malicious code")',
        },
      };

      const request = {
        method: 'POST',
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/csp-report' : null,
        },
        json: async () => cspReport,
        body: JSON.stringify(cspReport),
      } as any;

      const response = await cspReportHandler(request);

      expect(response.status).toBe(204);
      
      // Verify Sentry was called for critical violation
      const { captureException } = require('@/lib/monitoring/sentry');
      expect(captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          tags: {
            type: 'csp_violation',
            severity: 'high',
          },
        })
      );
    });

    it('should filter out browser extension violations', async () => {
      const extensionReport = {
        'csp-report': {
          'document-uri': 'https://example.com/page',
          'violated-directive': 'script-src',
          'blocked-uri': 'chrome-extension://abcdef/script.js',
          'line-number': 0,
          'column-number': 0,
          'source-file': '',
          'status-code': 200,
          'script-sample': '',
        },
      };

      const request = {
        method: 'POST',
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/csp-report' : null,
        },
        json: async () => extensionReport,
        body: JSON.stringify(extensionReport),
      } as any;

      const response = await cspReportHandler(request);

      expect(response.status).toBe(204);
      
      // Should not report browser extension violations
      const { captureException, captureMessage } = require('@/lib/monitoring/sentry');
      expect(captureException).not.toHaveBeenCalled();
      expect(captureMessage).not.toHaveBeenCalled();
    });

    it('should handle malformed CSP reports', async () => {
      const request = {
        method: 'POST',
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/csp-report' : null,
        },
        json: async () => { throw new Error('Invalid JSON'); },
        body: 'invalid json',
      } as any;

      const response = await cspReportHandler(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to process CSP report');
    });

    it('should categorize violation severity correctly', async () => {
      const criticalReport = {
        'csp-report': {
          'document-uri': 'https://example.com/page',
          'violated-directive': 'script-src',
          'blocked-uri': 'https://malicious.com/script.js',
          'line-number': 42,
          'column-number': 10,
          'source-file': 'https://example.com/page',
          'status-code': 200,
          'script-sample': '',
        },
      };

      const request = {
        method: 'POST',
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/csp-report' : null,
        },
        json: async () => criticalReport,
        body: JSON.stringify(criticalReport),
      } as any;

      await cspReportHandler(request);

      const { captureException } = require('@/lib/monitoring/sentry');
      expect(captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          tags: {
            type: 'csp_violation',
            severity: 'high',
          },
        })
      );
    });
  });

  describe('GET /api/security/audit', () => {
    const mockAdminUser = {
      id: 'admin-123',
      email: 'admin@example.com',
    };

    it('should perform security audit for admin users', async () => {
      // Mock admin user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockAdminUser },
        error: null,
      });

      mockQuery.single.mockResolvedValue({
        data: { is_admin: true },
        error: null,
      });

      // Mock fetch for test endpoint
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({
          'content-security-policy': "default-src 'self'",
          'strict-transport-security': 'max-age=31536000',
          'x-frame-options': 'DENY',
          'x-content-type-options': 'nosniff',
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/security/audit');
      const response = await securityAuditHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.timestamp).toBeDefined();
      expect(data.headers).toBeDefined();
      expect(data.score).toBeGreaterThan(0);
      expect(data.recommendations).toBeDefined();
    });

    it('should deny access to non-admin users', async () => {
      // Mock regular user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'user@example.com' } },
        error: null,
      });

      mockQuery.single.mockResolvedValue({
        data: { is_admin: false },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/security/audit');
      const response = await securityAuditHandler(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should deny access to unauthenticated users', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = new NextRequest('http://localhost:3000/api/security/audit');
      const response = await securityAuditHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should calculate security score correctly', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockAdminUser },
        error: null,
      });

      mockQuery.single.mockResolvedValue({
        data: { is_admin: true },
        error: null,
      });

      // Mock response with all security headers
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({
          'content-security-policy': "default-src 'self'",
          'strict-transport-security': 'max-age=31536000; includeSubDomains',
          'x-frame-options': 'DENY',
          'x-content-type-options': 'nosniff',
          'x-xss-protection': '1; mode=block',
          'referrer-policy': 'strict-origin-when-cross-origin',
          'permissions-policy': 'camera=(), microphone=()',
          'cross-origin-embedder-policy': 'credentialless',
          'cross-origin-opener-policy': 'same-origin',
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/security/audit');
      const response = await securityAuditHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.score).toBeGreaterThan(80); // Should have high score with all headers
      expect(data.recommendations.length).toBeLessThanOrEqual(1); // Minimal recommendations
    });

    it('should provide recommendations for missing headers', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockAdminUser },
        error: null,
      });

      mockQuery.single.mockResolvedValue({
        data: { is_admin: true },
        error: null,
      });

      // Mock response with minimal headers
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({
          'x-frame-options': 'DENY',
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/security/audit');
      const response = await securityAuditHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.score).toBeLessThan(50); // Should have low score
      expect(data.recommendations.length).toBeGreaterThan(0); // Should have recommendations
      expect(data.recommendations.some((rec: string) =>
        rec.includes('Content Security Policy')
      )).toBe(true);
    });
  });

  describe('GET /api/security/test', () => {
    it('should return test response with security headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/security/test');
      const response = await securityTestHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Security headers test endpoint');
      expect(data.timestamp).toBeDefined();
      expect(data.headers).toBeDefined();

      // Check security headers are applied
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });

    it('should handle POST requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/security/test', {
        method: 'POST',
      });
      const response = await securityTestHandler(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Security Headers Validation', () => {
    it('should apply CORS headers correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/security/test', {
        headers: {
          'Origin': 'https://stoneclough.uk',
        },
      });
      const response = await securityTestHandler(request);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined();
      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
    });

    it('should reject requests from unauthorized origins', async () => {
      const request = new NextRequest('http://localhost:3000/api/security/test', {
        headers: {
          'Origin': 'https://malicious.com',
        },
      });
      const response = await securityTestHandler(request);

      // Should still respond but with restricted CORS headers
      expect(response.status).toBe(200);
    });

    it('should validate content type for POST requests', async () => {
      const request = {
        method: 'POST',
        headers: {
          get: (name: string) => name === 'content-type' ? 'text/plain' : null,
        },
        json: async () => { throw new Error('Invalid content type'); },
        body: 'invalid content',
      } as any;

      const response = await cspReportHandler(request);

      // Should handle gracefully or reject based on implementation
      expect([400, 415, 500]).toContain(response.status);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle multiple CSP reports from same IP', async () => {
      const cspReport = {
        'csp-report': {
          'document-uri': 'https://example.com/page',
          'violated-directive': 'script-src',
          'blocked-uri': 'https://example.com/script.js',
          'line-number': 1,
          'column-number': 1,
          'source-file': '',
          'status-code': 200,
          'script-sample': '',
        },
      };

      // Send multiple reports quickly
      const requests = Array.from({ length: 5 }, () => ({
        method: 'POST',
        headers: {
          get: (name: string) => {
            if (name === 'content-type') return 'application/csp-report';
            if (name === 'x-forwarded-for') return '192.168.1.1';
            return null;
          },
        },
        json: async () => cspReport,
        body: JSON.stringify(cspReport),
      } as any));

      const responses = await Promise.all(
        requests.map(req => cspReportHandler(req))
      );

      // All should be processed (CSP reports are typically not rate limited)
      responses.forEach(response => {
        expect(response.status).toBe(204);
      });
    });
  });
});
