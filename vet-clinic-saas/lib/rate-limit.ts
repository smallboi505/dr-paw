/**
 * Rate limiting — disabled (Upstash removed)
 * All limiters return success:true by default
 * Re-enable with a proper Redis provider when needed at scale
 */

const noopLimiter = {
  limit: async (_identifier: string) => ({
    success: true,
    limit: 999,
    remaining: 999,
    reset: Date.now() + 60000,
  }),
};

export const strictRateLimit = noopLimiter;
export const standardRateLimit = noopLimiter;
export const generousRateLimit = noopLimiter;

export async function checkRateLimit(
  _identifier: string,
  _limit = standardRateLimit
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  return { success: true, limit: 999, remaining: 999, reset: Date.now() + 60000 };
}

export function getRateLimitIdentifier(userId?: string, ip?: string): string {
  if (userId) return `user:${userId}`;
  if (ip) return `ip:${ip}`;
  return "anonymous";
}

export function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return undefined;
}