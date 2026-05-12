const rateLimitMap = new Map();

/**
 * Basic in-memory rate limiting.
 * For production, consider using Redis.
 */
export function rateLimit(ip, limit = 10, windowMs = 60000) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.lastReset > windowMs) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}
