/**
 * Simple in-memory rate limiter for API routes
 * Note: For production, consider using Redis or Upstash rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store - resets on server restart
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

interface RateLimitConfig {
  windowMs: number;   // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Check rate limit for an identifier (IP, user ID, etc.)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 60 }
): RateLimitResult {
  const now = Date.now();
  const key = identifier;

  let entry = rateLimitStore.get(key);

  // Create new entry if none exists or window has expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime,
    };
  }

  // Increment counter
  entry.count++;

  // Check if over limit
  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000).toString(),
  };
}

/**
 * Rate limit configurations for different routes
 */
export const RATE_LIMITS = {
  // Chat API - more restrictive (AI costs money)
  chat: { windowMs: 60000, maxRequests: 20 },

  // Standard API routes
  api: { windowMs: 60000, maxRequests: 60 },

  // Auth routes - prevent brute force
  auth: { windowMs: 300000, maxRequests: 10 }, // 10 attempts per 5 minutes
} as const;
