import { describe, it, expect } from '@jest/globals';
import { initSentry } from '@/src/infrastructure/services/sentry';

describe('initSentry', () => {
  it('resolves as a no-op when SENTRY_DSN is unset', async () => {
    const prev = process.env.SENTRY_DSN;
    delete process.env.SENTRY_DSN;
    await expect(initSentry()).resolves.toBeUndefined();
    if (prev !== undefined) process.env.SENTRY_DSN = prev;
  });
});
