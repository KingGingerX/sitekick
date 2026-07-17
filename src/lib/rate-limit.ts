interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
}

export function rateLimit(
  identifier: string,
  opts: RateLimitOptions = {}
): { allowed: boolean; remaining: number; resetAt: number } {
  const windowMs = opts.windowMs ?? 60_000;
  const maxRequests = opts.maxRequests ?? 30;
  const now = Date.now();

  const entry = store.get(identifier);
  if (!entry || now > entry.resetAt) {
    const newEntry: RateLimitEntry = { count: 1, resetAt: now + windowMs };
    store.set(identifier, newEntry);
    return { allowed: true, remaining: maxRequests - 1, resetAt: newEntry.resetAt };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

// Periodic cleanup every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 300_000);
