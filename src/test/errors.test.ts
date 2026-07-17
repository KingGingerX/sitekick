import { describe, it, expect } from 'vitest';
import { apiError } from '@/lib/errors';
import { ValidationError } from '@/lib/validate';

describe('apiError', () => {
  it('returns 400 for ValidationError', () => {
    const res = apiError(new ValidationError('bad input'));
    expect(res.status).toBe(400);
  });

  it('returns 500 for generic errors', () => {
    const res = apiError(new Error('something broke'));
    expect(res.status).toBe(500);
  });

  it('returns 500 for unknown errors', () => {
    const res = apiError('weird error');
    expect(res.status).toBe(500);
  });
});
