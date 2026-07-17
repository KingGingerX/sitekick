import { describe, it, expect, beforeAll } from 'vitest';
import { signSession, verifySession } from '@/lib/auth';

beforeAll(() => {
  process.env.ADMIN_PASSWORD = 'super_secret_test_password_123';
});

describe('auth', () => {
  it('signs and verifies a session', async () => {
    const token = await signSession();
    expect(typeof token).toBe('string');
    expect(await verifySession(token)).toBe(true);
  });

  it('rejects invalid token', async () => {
    expect(await verifySession('invalid.token.here')).toBe(false);
  });

  it('rejects empty token', async () => {
    expect(await verifySession('')).toBe(false);
  });
});
