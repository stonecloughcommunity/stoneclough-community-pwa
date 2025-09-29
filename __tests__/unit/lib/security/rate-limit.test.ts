import {
  createRateLimiter,
  checkRateLimit,
  getRateLimitInfo,
  resetRateLimit,
  RateLimitConfig,
} from '@/lib/security/rate-limit';

// Mock NextRequest for testing
class MockNextRequest {
  headers: Map<string, string>;
  url: string;

  constructor(url: string, options: { headers?: Record<string, string> } = {}) {
    this.url = url;
    this.headers = new Map();

    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        this.headers.set(key.toLowerCase(), value);
      });
    }
  }

  get(name: string): string | null {
    return this.headers.get(name.toLowerCase()) || null;
  }
}

// Create a proper mock that mimics NextRequest
const createMockRequest = (url: string, headers: Record<string, string> = {}) => {
  // Normalize headers to lowercase for case-insensitive lookup
  const normalizedHeaders: Record<string, string> = {};
  Object.entries(headers).forEach(([key, value]) => {
    normalizedHeaders[key.toLowerCase()] = value;
  });

  const mockHeaders = {
    get: (name: string) => normalizedHeaders[name.toLowerCase()] || null,
  };

  return {
    url,
    headers: mockHeaders,
  } as any;
};

// Mock Redis for testing
jest.mock('@/lib/database/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
  },
}));

// Get the mocked redis instance
const { redis: mockRedis } = jest.requireMock('@/lib/database/redis');

describe('Rate Limiting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRateLimiter', () => {
    it('should create rate limiter with default config', () => {
      const limiter = createRateLimiter();

      expect(limiter).toBeDefined();
      expect(typeof limiter.check).toBe('function');
      expect(typeof limiter.reset).toBe('function');
    });

    it('should create rate limiter with custom config', () => {
      const config: RateLimitConfig = {
        windowMs: 60000,
        maxRequests: 100,
        keyGenerator: (req) => req.ip || 'unknown',
        skipSuccessfulRequests: true,
      };

      const limiter = createRateLimiter(config);
      expect(limiter).toBeDefined();
    });

    it('should handle different rate limit types', () => {
      const authLimiter = createRateLimiter({
        windowMs: 900000, // 15 minutes
        maxRequests: 5,
        keyGenerator: (req) => `auth:${req.ip}`,
      });

      const apiLimiter = createRateLimiter({
        windowMs: 60000, // 1 minute
        maxRequests: 1000,
        keyGenerator: (req) => `api:${req.ip}`,
      });

      expect(authLimiter).toBeDefined();
      expect(apiLimiter).toBeDefined();
    });
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', async () => {
      mockRedis.get.mockResolvedValue('5'); // Current count
      mockRedis.incr.mockResolvedValue(6);

      const request = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.1',
      });

      const result = await checkRateLimit(request, {
        windowMs: 60000,
        maxRequests: 100,
      });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(94); // 100 - 6
      expect(result.resetTime).toBeDefined();
    });

    it('should block requests exceeding limit', async () => {
      mockRedis.get.mockResolvedValue('100'); // At limit
      mockRedis.incr.mockResolvedValue(101);

      const request = createMockRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const result = await checkRateLimit(request, {
        windowMs: 60000,
        maxRequests: 100,
      });

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeDefined();
    });

    it('should handle first request correctly', async () => {
      mockRedis.get.mockResolvedValue(null); // No previous requests
      mockRedis.incr.mockResolvedValue(1);

      const request = createMockRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const result = await checkRateLimit(request, {
        windowMs: 60000,
        maxRequests: 100,
      });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99);
      expect(mockRedis.expire).toHaveBeenCalled();
    });

    it('should use custom key generator', async () => {
      mockRedis.get.mockResolvedValue('1');
      mockRedis.incr.mockResolvedValue(2);

      const request = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.1',
        'authorization': 'Bearer token123',
      });

      await checkRateLimit(request, {
        windowMs: 60000,
        maxRequests: 100,
        keyGenerator: (req) => `user:${req.headers.get('authorization')}`,
      });

      expect(mockRedis.get).toHaveBeenCalledWith('rate_limit:user:Bearer token123');
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

      const request = createMockRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const result = await checkRateLimit(request, {
        windowMs: 60000,
        maxRequests: 100,
      });

      // Should allow request when Redis fails (fail open)
      expect(result.allowed).toBe(true);
    });
  });

  describe('getRateLimitInfo', () => {
    it('should return current rate limit status', async () => {
      mockRedis.get.mockResolvedValue('25');

      const info = await getRateLimitInfo('test-key', {
        windowMs: 60000,
        maxRequests: 100,
      });

      expect(info.current).toBe(25);
      expect(info.remaining).toBe(75);
      expect(info.resetTime).toBeDefined();
    });

    it('should handle non-existent key', async () => {
      mockRedis.get.mockResolvedValue(null);

      const info = await getRateLimitInfo('non-existent-key', {
        windowMs: 60000,
        maxRequests: 100,
      });

      expect(info.current).toBe(0);
      expect(info.remaining).toBe(100);
    });
  });

  describe('resetRateLimit', () => {
    it('should reset rate limit for key', async () => {
      mockRedis.del.mockResolvedValue(1);

      const result = await resetRateLimit('test-key');

      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith('rate_limit:test-key');
    });

    it('should handle reset errors', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis error'));

      const result = await resetRateLimit('test-key');

      expect(result).toBe(false);
    });
  });

  describe('IP Address Extraction', () => {
    it('should extract IP from x-forwarded-for header', async () => {
      mockRedis.get.mockResolvedValue('1');
      mockRedis.incr.mockResolvedValue(2);

      const request = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
      });

      await checkRateLimit(request, {
        windowMs: 60000,
        maxRequests: 100,
      });

      expect(mockRedis.get).toHaveBeenCalledWith('rate_limit:192.168.1.1');
    });

    it('should extract IP from x-real-ip header', async () => {
      mockRedis.get.mockResolvedValue('1');
      mockRedis.incr.mockResolvedValue(2);

      const request = createMockRequest('http://localhost:3000/api/test', {
        'x-real-ip': '203.0.113.1',
      });

      await checkRateLimit(request, {
        windowMs: 60000,
        maxRequests: 100,
      });

      expect(mockRedis.get).toHaveBeenCalledWith('rate_limit:203.0.113.1');
    });

    it('should handle missing IP address', async () => {
      mockRedis.get.mockResolvedValue('1');
      mockRedis.incr.mockResolvedValue(2);

      const request = createMockRequest('http://localhost:3000/api/test');

      await checkRateLimit(request, {
        windowMs: 60000,
        maxRequests: 100,
      });

      expect(mockRedis.get).toHaveBeenCalledWith('rate_limit:unknown');
    });
  });

  describe('Different Rate Limit Scenarios', () => {
    it('should handle authentication rate limiting', async () => {
      mockRedis.get.mockResolvedValue('4');
      mockRedis.incr.mockResolvedValue(5);

      const request = createMockRequest('http://localhost:3000/api/auth/login', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const result = await checkRateLimit(request, {
        windowMs: 900000, // 15 minutes
        maxRequests: 5,
        keyGenerator: (req) => `auth:${req.ip}`,
      });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('should handle API rate limiting', async () => {
      mockRedis.get.mockResolvedValue('999');
      mockRedis.incr.mockResolvedValue(1000);

      const request = createMockRequest('http://localhost:3000/api/data', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const result = await checkRateLimit(request, {
        windowMs: 60000, // 1 minute
        maxRequests: 1000,
        keyGenerator: (req) => `api:${req.ip}`,
      });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('should handle file upload rate limiting', async () => {
      mockRedis.get.mockResolvedValue('2');
      mockRedis.incr.mockResolvedValue(3);

      const request = createMockRequest('http://localhost:3000/api/upload', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const result = await checkRateLimit(request, {
        windowMs: 3600000, // 1 hour
        maxRequests: 10,
        keyGenerator: (req) => `upload:${req.ip}`,
      });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(7);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent requests', async () => {
      mockRedis.get.mockResolvedValue('99');
      mockRedis.incr.mockResolvedValue(100);

      const request = createMockRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const promises = Array(5).fill(null).map(() => 
        checkRateLimit(request, {
          windowMs: 60000,
          maxRequests: 100,
        })
      );

      const results = await Promise.all(promises);
      
      // At least one should be allowed
      expect(results.some(r => r.allowed)).toBe(true);
    });

    it('should handle very high limits', async () => {
      mockRedis.get.mockResolvedValue('999999');
      mockRedis.incr.mockResolvedValue(1000000);

      const request = createMockRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const result = await checkRateLimit(request, {
        windowMs: 60000,
        maxRequests: 1000000,
      });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('should handle zero window time', async () => {
      const request = createMockRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const result = await checkRateLimit(request, {
        windowMs: 0,
        maxRequests: 100,
      });

      // Should allow all requests with zero window
      expect(result.allowed).toBe(true);
    });
  });
});
