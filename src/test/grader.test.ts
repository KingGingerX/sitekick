import { describe, it, expect } from 'vitest';
import { gradeWebsite, isWorthContacting } from '@/lib/grader/website-grader';

describe('website-grader', () => {
  it('returns 0 for null URL', async () => {
    const result = await gradeWebsite(null);
    expect(result.score).toBe(0);
    expect(result.hasSite).toBe(false);
    expect(result.issues).toContain('No website found');
  });

  it('returns low score for unreachable site', async () => {
    const result = await gradeWebsite('https://this-domain-definitely-does-not-exist-12345.xyz');
    expect(result.score).toBeLessThanOrEqual(5);
    expect(result.hasSite).toBe(true);
  });

  it('isWorthContacting returns true', () => {
    expect(isWorthContacting({ score: 0, hasSite: false, issues: [] })).toBe(true);
  });
});
