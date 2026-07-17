import { describe, it, expect } from 'vitest';
import { rateLimit } from '@/lib/rate-limit';

describe('rateLimit', () => {
  it('allows requests under the limit', () => {
    const id = 'user-1';
    const result = rateLimit(id, { windowMs: 60_000, maxRequests: 2 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('blocks requests over the limit', () => {
    const id = 'user-2';
    rateLimit(id, { windowMs: 60_000, maxRequests: 1 });
    const result = rateLimit(id, { windowMs: 60_000, maxRequests: 1 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets after window expires', () => {
    const id = 'user-3';
    rateLimit(id, { windowMs: 1, maxRequests: 1 });
    // Wait for window to expire
    const start = Date.now();
    while (Date.now() - start < 10) {
      // busy wait
    }
    const result = rateLimit(id, { windowMs: 1, maxRequests: 1 });
    expect(result.allowed).toBe(true);
  });
});
