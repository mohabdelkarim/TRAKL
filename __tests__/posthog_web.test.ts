import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockInit = jest.fn();
jest.mock('posthog-js', () => ({
  __esModule: true,
  posthog: {
    init: (...args: unknown[]) => mockInit(...args),
  },
}));

import { initPostHog } from '@/src/infrastructure/services/posthog.web';

function stubWindow(search: string, isIframe: boolean) {
  const win: { parent?: unknown; location: { search: string } } = {
    location: { search },
  };
  win.parent = isIframe ? { other: true } : win;
  Object.defineProperty(globalThis, 'window', { configurable: true, value: win });
}

describe('posthog.web init', () => {
  beforeEach(() => {
    mockInit.mockClear();
  });

  it('no-ops when host is not allow-listed', () => {
    stubWindow('?__ph_key=phc_test&__ph_host=https://evil.example', true);
    initPostHog();
    expect(mockInit).not.toHaveBeenCalled();
  });

  it('masks inputs when host is allow-listed', () => {
    stubWindow('?__ph_key=phc_test&__ph_host=https://eu.posthog.com', true);
    initPostHog();
    expect(mockInit).toHaveBeenCalled();
    const opts = mockInit.mock.calls[0]?.[1] as {
      session_recording?: { maskAllInputs?: boolean; maskTextSelector?: string };
    };
    expect(opts.session_recording?.maskAllInputs).toBe(true);
    expect(opts.session_recording?.maskTextSelector).toBe('*');
  });
});
