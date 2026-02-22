import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Global API rate limiter middleware
 * Protects ALL /api routes with a generous baseline limit
 * Individual routes can add stricter limits on top
 */

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Global baseline: 1000 requests per minute per IP
const globalRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/global",
});

export async function rateLimitMiddleware(request: NextRequest) {
  // Only apply to API routes
  if (!request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Skip rate limiting for health checks and static routes
  const skipPaths = ["/api/health", "/api/status"];
  if (skipPaths.includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Get IP address
  const ip = getIpFromRequest(request);
  
  // Check global rate limit
  const { success, limit, remaining, reset } = await globalRateLimit.limit(
    `global:${ip}`
  );

  if (!success) {
    return NextResponse.json(
      {
        error: "Global rate limit exceeded. Too many API requests.",
        limit,
        remaining: 0,
        reset,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": reset.toString(),
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  // Add rate limit headers to successful responses
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", limit.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set("X-RateLimit-Reset", reset.toString());

  return response;
}

function getIpFromRequest(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  const vercelIp = request.headers.get("x-vercel-forwarded-for");
  if (vercelIp) {
    return vercelIp;
  }

  return "unknown";
}