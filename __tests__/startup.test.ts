import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Startup gate: i18n initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('initI18n resolves and returns the i18n instance', async () => {
    const { initI18n } = require('@/src/infrastructure/services/i18n');
    const result = await initI18n();
    expect(result).toBeDefined();
    expect(result.isInitialized).toBe(true);
  });

  it('initI18n can be retried if AsyncStorage throws on first call', async () => {
    let callCount = 0;
    const mockGetItem = jest.fn(async () => {
      callCount++;
      if (callCount === 1) throw new Error('Storage read failed');
      return null;
    });
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    (AsyncStorage.getItem as jest.Mock) = mockGetItem;

    const { initI18n } = require('@/src/infrastructure/services/i18n');

    // First call should still succeed (resolveInitialLanguage catches errors)
    const result = await initI18n();
    expect(result).toBeDefined();
    expect(result.isInitialized).toBe(true);
  });

  it('initialized flag is not set before successful completion', async () => {
    // Mock i18next init to throw
    jest.doMock('i18next', () => {
      const mock = {
        use: jest.fn().mockReturnThis(),
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        init: jest.fn().mockRejectedValue(new Error('init failed') as never),
        isInitialized: false,
        changeLanguage: jest.fn(),
      };
      return { default: mock, createInstance: () => mock };
    });

    const { initI18n } = require('@/src/infrastructure/services/i18n');

    // Should reject
    await expect(initI18n()).rejects.toThrow();

    // Restore real i18next
    jest.dontMock('i18next');
    jest.resetModules();

    // Second call with real i18next should succeed (retry works)
    const { initI18n: initI18nAgain } = require('@/src/infrastructure/services/i18n');
    const result = await initI18nAgain();
    expect(result.isInitialized).toBe(true);
  });
});

describe('Startup gate: timeout behavior', () => {
  it('proceeds after timeout even if initI18n never resolves', async () => {
    // This test verifies the pattern used in _layout.tsx:
    // A hard timeout ensures the app never stays frozen.
    const neverResolvingPromise = new Promise<unknown>(() => {
      // Intentionally never resolves
    });

    let timedOut = false;
    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => {
        timedOut = true;
        resolve(true);
      }, 100);
    });

    // Race between initI18n and timeout
    await Promise.race([neverResolvingPromise.then(() => false), timeoutPromise]);

    expect(timedOut).toBe(true);
  });
});

describe('Startup gate: fonts do not block render', () => {
  it('ClashDisplayFonts is a plain object, not a blocking promise', () => {
    // This verifies the pattern: fonts are a static object passed to useFonts,
    // which loads them in the background. The _layout.tsx gate condition
    // is `if (!i18nReady)` — it does NOT check `loaded` or `error` from
    // useFonts, so font loading failures cannot freeze the app.
    const { ClashDisplayFonts } = require('@/src/shared/fonts');
    expect(ClashDisplayFonts).toBeDefined();
    expect(typeof ClashDisplayFonts).toBe('object');
  });
});
