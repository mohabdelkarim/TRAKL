import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';

const DEFAULT_APP_STORE_APP_ID = '6800000662';
const DEFAULT_PLAY_STORE_PACKAGE = 'trakl.app';

/** Fallback when i18n is unavailable (tests / early boot). Prefer `profile.shareMessage`. */
export const SHARE_MESSAGE =
  'TRAKL. Everything. Tracked. Track habits, tasks, sleep, finance and more.';

export type StorePlatform = 'ios' | 'android' | 'unknown';

export type ShareMessageOptions = {
  /** Localized share blurb; defaults to {@link SHARE_MESSAGE}. */
  message?: string;
};

function readExtraString(key: string, fallback: string): string {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const value = extra?.[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

export function getAppStoreAppId(): string {
  return readExtraString('appStoreAppId', DEFAULT_APP_STORE_APP_ID);
}

export function getPlayStorePackage(): string {
  return readExtraString('playStorePackage', DEFAULT_PLAY_STORE_PACKAGE);
}

export function getAppStoreListingUrl(): string {
  return `https://apps.apple.com/app/id${getAppStoreAppId()}`;
}

export function getAppStoreReviewUrl(): string {
  return `${getAppStoreListingUrl()}?action=write-review`;
}

export function getPlayStoreListingUrl(): string {
  return `https://play.google.com/store/apps/details?id=${getPlayStorePackage()}`;
}

export function resolveStorePlatformFromUserAgent(userAgent: string): StorePlatform {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
  if (/Android/i.test(userAgent)) return 'android';
  return 'unknown';
}

export function resolveStorePlatform(): StorePlatform {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    return resolveStorePlatformFromUserAgent(navigator.userAgent);
  }
  return 'unknown';
}

export function getStoreListingUrl(platform: StorePlatform): string | null {
  if (platform === 'ios') return getAppStoreListingUrl();
  if (platform === 'android') return getPlayStoreListingUrl();
  return null;
}

export function getStoreReviewUrl(platform: StorePlatform): string | null {
  if (platform === 'ios') return getAppStoreReviewUrl();
  if (platform === 'android') return getPlayStoreListingUrl();
  return null;
}

export function openStoreReview(): Promise<'opened' | 'needs_picker'> {
  const platform = resolveStorePlatform();
  const url = getStoreReviewUrl(platform);
  if (!url) return Promise.resolve('needs_picker');
  return Linking.openURL(url).then(() => 'opened' as const);
}

export function openAppStoreReview(): Promise<void> {
  return Linking.openURL(getAppStoreReviewUrl());
}

export function openPlayStoreListing(): Promise<void> {
  return Linking.openURL(getPlayStoreListingUrl());
}

export function buildSharePayload(opts?: ShareMessageOptions): { message: string; url?: string } {
  const blurb = (opts?.message?.trim() || SHARE_MESSAGE).trim();
  const platform = resolveStorePlatform();

  if (platform === 'ios') {
    return { message: blurb, url: getAppStoreListingUrl() };
  }

  if (platform === 'android') {
    return { message: `${blurb}\n${getPlayStoreListingUrl()}` };
  }

  return {
    message: `${blurb}\n${getAppStoreListingUrl()}\n${getPlayStoreListingUrl()}`,
  };
}

export function getShareText(opts?: ShareMessageOptions): string {
  const payload = buildSharePayload(opts);
  return payload.url ? `${payload.message}\n${payload.url}` : payload.message;
}
