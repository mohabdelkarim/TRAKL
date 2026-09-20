import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Linking, Platform } from 'react-native';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        appStoreAppId: '6800000662',
        playStorePackage: 'trakl.app',
      },
    },
  },
}));

import {
  buildSharePayload,
  getAppStoreReviewUrl,
  getPlayStoreListingUrl,
  getShareText,
  openStoreReview,
  resolveStorePlatform,
  resolveStorePlatformFromUserAgent,
} from '@/src/shared/storeLinks';

describe('storeLinks', () => {
  let openURL: jest.SpiedFunction<typeof Linking.openURL>;

  beforeEach(() => {
    openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    openURL.mockClear();
  });

  it('builds App Store review URL', () => {
    expect(getAppStoreReviewUrl()).toBe(
      'https://apps.apple.com/app/id6800000662?action=write-review',
    );
  });

  it('builds Play Store listing URL', () => {
    expect(getPlayStoreListingUrl()).toBe(
      'https://play.google.com/store/apps/details?id=trakl.app',
    );
  });

  it('detects iOS and Android from user agent', () => {
    expect(
      resolveStorePlatformFromUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'),
    ).toBe('ios');
    expect(resolveStorePlatformFromUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8)')).toBe(
      'android',
    );
    expect(resolveStorePlatformFromUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(
      'unknown',
    );
  });

  it('builds iOS share payload with separate url field', () => {
    (Platform as { OS: string }).OS = 'ios';
    expect(buildSharePayload()).toEqual({
      message: expect.stringContaining('TRAKL'),
      url: 'https://apps.apple.com/app/id6800000662',
    });
    expect(getShareText()).toContain('https://apps.apple.com/app/id6800000662');
  });

  it('builds Android share payload with Play Store link in message', () => {
    (Platform as { OS: string }).OS = 'android';
    const payload = buildSharePayload();
    expect(payload.url).toBeUndefined();
    expect(payload.message).toContain('https://play.google.com/store/apps/details?id=trakl.app');
    expect(getShareText()).toBe(payload.message);
  });

  it('includes both store links when platform is unknown', () => {
    (Platform as { OS: string }).OS = 'web';
    const originalNavigator = global.navigator;
    Object.defineProperty(global, 'navigator', {
      configurable: true,
      value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });

    expect(resolveStorePlatform()).toBe('unknown');
    const payload = buildSharePayload();
    expect(payload.message).toContain('https://apps.apple.com/app/id6800000662');
    expect(payload.message).toContain('https://play.google.com/store/apps/details?id=trakl.app');

    Object.defineProperty(global, 'navigator', {
      configurable: true,
      value: originalNavigator,
    });
  });

  it('opens store review URL on iOS', async () => {
    (Platform as { OS: string }).OS = 'ios';
    await expect(openStoreReview()).resolves.toBe('opened');
    expect(openURL).toHaveBeenCalledWith(
      'https://apps.apple.com/app/id6800000662?action=write-review',
    );
  });

  it('opens Play Store listing on Android', async () => {
    (Platform as { OS: string }).OS = 'android';
    await expect(openStoreReview()).resolves.toBe('opened');
    expect(openURL).toHaveBeenCalledWith('https://play.google.com/store/apps/details?id=trakl.app');
  });

  it('returns needs_picker when platform is unknown', async () => {
    (Platform as { OS: string }).OS = 'web';
    const originalNavigator = global.navigator;
    Object.defineProperty(global, 'navigator', {
      configurable: true,
      value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });

    await expect(openStoreReview()).resolves.toBe('needs_picker');
    expect(openURL).not.toHaveBeenCalled();

    Object.defineProperty(global, 'navigator', {
      configurable: true,
      value: originalNavigator,
    });
  });
});
