import { redis } from "@/lib/database/redis";
import { env } from "@/lib/config/environment";
import { NextRequest } from "next/server";
import { captureException } from "@/lib/monitoring/sentry";

// Rate limit configuration interface
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
}

// Rate limit result interface
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
  current: number;
}

// Rate limit info interface
export interface RateLimitInfo {
  current: number;
  remaining: number;
  resetTime: Date;
}

// Default key generator - extracts IP address
function defaultKeyGenerator(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

// Check rate limit for a request
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const { windowMs, maxRequests, keyGenerator = defaultKeyGenerator } = config;

    // Special case: zero window means no rate limiting
    if (windowMs === 0) {
      return {
        allowed: true,
        remaining: maxRequests,
        resetTime: new Date(),
        current: 0,
      };
    }

    const key = `rate_limit:${keyGenerator(request)}`;

    // Get current count
    const current = await redis.get(key);
    const currentCount = current ? parseInt(current, 10) : 0;

    // Increment counter
    const newCount = await redis.incr(key);

    // Set expiry on first request
    if (newCount === 1) {
      await redis.expire(key, Math.ceil(windowMs / 1000));
    }

    const remaining = Math.max(0, maxRequests - newCount);
    const resetTime = new Date(Date.now() + windowMs);
    const allowed = newCount <= maxRequests;

    const result: RateLimitResult = {
      allowed,
      remaining,
      resetTime,
      current: newCount,
    };

    if (!allowed) {
      result.retryAfter = Math.ceil(windowMs / 1000);
    }

    return result;
  } catch (error) {
    captureException(error instanceof Error ? error : new Error('Rate limit check failed'));

    // Fail open - allow request if Redis is down
    return {
      allowed: true,
      remaining: 999,
      resetTime: new Date(Date.now() + 60000),
      current: 0,
    };
  }
}
// Get rate limit info for a key
export async function getRateLimitInfo(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitInfo> {
  try {
    const { windowMs, maxRequests } = config;
    const redisKey = `rate_limit:${key}`;

    const current = await redis.get(redisKey);
    const currentCount = current ? parseInt(current, 10) : 0;
    const remaining = Math.max(0, maxRequests - currentCount);
    const resetTime = new Date(Date.now() + windowMs);

    return {
      current: currentCount,
      remaining,
      resetTime,
    };
  } catch (error) {
    captureException(error instanceof Error ? error : new Error('Rate limit info failed'));

    return {
      current: 0,
      remaining: config.maxRequests,
      resetTime: new Date(Date.now() + config.windowMs),
    };
  }
}

// Reset rate limit for a key
export async function resetRateLimit(key: string): Promise<boolean> {
  try {
    const redisKey = `rate_limit:${key}`;
    await redis.del(redisKey);
    return true;
  } catch (error) {
    captureException(error instanceof Error ? error : new Error('Rate limit reset failed'));
    return false;
  }
}
// Create a rate limiter with configuration
export function createRateLimiter(config?: RateLimitConfig) {
  const defaultConfig: RateLimitConfig = {
    windowMs: 60000, // 1 minute
    maxRequests: 100,
    keyGenerator: defaultKeyGenerator,
  };

  const finalConfig = { ...defaultConfig, ...config };

  return {
    check: (request: NextRequest) => checkRateLimit(request, finalConfig),
    reset: (key: string) => resetRateLimit(key),
    info: (key: string) => getRateLimitInfo(key, finalConfig),
  };
}
// Predefined rate limit configurations
export const rateLimitConfigs = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyGenerator: (req: NextRequest) => `auth:${defaultKeyGenerator(req)}`,
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyGenerator: (req: NextRequest) => `api:${defaultKeyGenerator(req)}`,
  },
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    keyGenerator: (req: NextRequest) => `upload:${defaultKeyGenerator(req)}`,
  },
  general: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000,
    keyGenerator: (req: NextRequest) => `general:${defaultKeyGenerator(req)}`,
  },
};

