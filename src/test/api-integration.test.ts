import { describe, it, expect, beforeAll } from 'vitest';

describe('API Integration Smoke Tests', () => {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';

  beforeAll(() => {
    // Ensure test env is set
    process.env.ADMIN_PASSWORD = 'test_password_12345';
  });

  it('health endpoint returns ok', async () => {
    // This test assumes the dev server is running on TEST_BASE_URL
    // In CI, this would be skipped or the server would be started beforehand
    if (!process.env.TEST_BASE_URL) {
      return;
    }
    const res = await fetch(`${baseUrl}/api/health`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('ok');
  });

  it('login rejects bad password', async () => {
    if (!process.env.TEST_BASE_URL) {
      return;
    }
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrong' }),
    });
    expect(res.status).toBe(401);
  });
});
