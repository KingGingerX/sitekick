import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '@/lib/logger';

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs info messages', () => {
    logger.info('Test info', { user: 'admin' });
    expect(console.info).toHaveBeenCalled();
  });

  it('logs warn messages', () => {
    logger.warn('Test warn');
    expect(console.warn).toHaveBeenCalled();
  });

  it('logs error messages', () => {
    logger.error('Test error', { code: 500 });
    expect(console.error).toHaveBeenCalled();
  });
});
