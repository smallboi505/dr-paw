import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting tiers for different API operations
 * Production-ready configuration with Upstash Redis
 */

// Initialize Redis connection
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * STRICT rate limit for sensitive operations
 * Use for: Authentication, password reset, invite sending
 * Limit: 10 requests per minute
 */
export const strictRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/strict",
});

/**
 * STANDARD rate limit for normal API operations
 * Use for: CRUD operations (create/update/delete)
 * Limit: 60 requests per minute
 */
export const standardRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/standard",
});

/**
 * GENEROUS rate limit for read operations
 * Use for: Listing, searching, viewing data
 * Limit: 300 requests per minute
 */
export const generousRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(300, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/generous",
});

/**
 * Helper to check rate limit and return standardized error
 */
export async function checkRateLimit(
  identifier: string,
  limit: Ratelimit = standardRateLimit
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const { success, limit: max, remaining, reset } = await limit.limit(identifier);
  
  return {
    success,
    limit: max,
    remaining,
    reset,
  };
}

/**
 * Get rate limit identifier from request
 * Priority: userId > IP address
 */
export function getRateLimitIdentifier(userId?: string, ip?: string): string {
  // Prefer user ID for authenticated requests
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fall back to IP for anonymous requests
  if (ip) {
    return `ip:${ip}`;
  }
  
  // Last resort (shouldn't happen in production)
  return "anonymous";
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string | undefined {
  // Check common proxy headers first
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  
  // Vercel-specific header
  const vercelIp = request.headers.get("x-vercel-forwarded-for");
  if (vercelIp) {
    return vercelIp;
  }
  
  return undefined;
}