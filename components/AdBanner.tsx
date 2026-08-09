import { useEffect, useState } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { bannerUnitId, USE_TEST_ADS } from '@/src/infrastructure/services/admobConfig';
import { getConsentStatus, requestAndShowConsent } from '@/src/infrastructure/services/consent';

// Platform-correct banner unit ID (Android unit on Android, iOS unit on iOS),
// test unit in dev / production unit in release. See lib/admobConfig.ts.
const BANNER_UNIT_ID = bannerUnitId;

const LOG = '[AdMob]';

// Track whether we've already logged the unit info this session
// to avoid spamming the console on every AdBanner mount.
let loggedUnit = false;
let loggedExpoGoWarning = false;

type GoogleMobileAds = typeof import('react-native-google-mobile-ads');

// The native AdMob module is only present in a dev build / TestFlight / published
// app. In Expo Go (storeClient) the TurboModule isn't registered, so even
// touching the module throws "RNGoogleMobileAdsModule could not be found".
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Module-level shared state
// The SDK is imported and initialized only ONCE for the entire app lifetime.
// All AdBanner instances share the same module reference, so navigating
// between pages doesn't re-initialize the SDK (which caused ads to only
// load on the first page).
let sharedAds: GoogleMobileAds | null = null;
let sharedFailed = false;
let sharedConsent: 'unknown' | 'granted' | 'denied' = 'unknown';
let sdkInitPromise: Promise<void> | null = null;

/** Lazily import + initialize the SDK exactly once. Returns when ready. */
function ensureSdkReady(): Promise<void> {
  if (sharedAds || sharedFailed) return Promise.resolve();
  if (sdkInitPromise) return sdkInitPromise;

  sdkInitPromise = (async () => {
    if (__DEV__ && !loggedUnit) {
      loggedUnit = true;
      console.log(`${LOG} unit in use:`, BANNER_UNIT_ID, USE_TEST_ADS ? '(TEST)' : '(PROD)');
    }

    // Resolve consent first.
    try {
      const status = await getConsentStatus();
      if (status !== 'unknown') {
        sharedConsent = status;
      } else {
        sharedConsent = await requestAndShowConsent();
      }
    } catch {
      sharedConsent = 'granted';
    }

    if (sharedConsent !== 'granted') {
      sharedFailed = true;
      return;
    }

    try {
      if (__DEV__) console.log(`${LOG} loading native SDK module...`);
      const mod = await import('react-native-google-mobile-ads');
      if (mod?.default && mod?.BannerAd) {
        if (__DEV__) console.log(`${LOG} module loaded, initializing SDK...`);
        const statuses = await mod.default().initialize();
        if (__DEV__) console.log(`${LOG} SDK initialized:`, statuses);
        // Do not render BannerAd until initialize() has completed. Rendering
        // before the native SDK is ready can leave the banner permanently
        // invisible on a cold native start.
        sharedAds = mod;
      } else {
        if (__DEV__) console.warn(`${LOG} module loaded but BannerAd/default missing.`);
        sharedFailed = true;
      }
    } catch (e) {
      if (__DEV__) console.warn(`${LOG} failed to import native SDK:`, e);
      sharedFailed = true;
    }
  })();

  return sdkInitPromise;
}

/**
 * Google AdMob banner. Loads the native ad SDK when available (dev build /
 * TestFlight / published app). When the SDK isn't present, the ad fails to
 * load, or consent isn't granted, renders nothing — only the real ad is shown.
 *
 * The SDK is initialized once at the module level and shared across all
 * AdBanner instances, so ads load on every page — not just the first.
 */
export function AdBanner() {
  const [ready, setReady] = useState(sharedAds !== null || sharedFailed);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(sharedFailed);

  useEffect(() => {
    if (isExpoGo) {
      if (__DEV__ && !loggedExpoGoWarning) {
        loggedExpoGoWarning = true;
        console.warn(
          `${LOG} disabled in Expo Go. Use a development build or a release build to load AdMob.`,
        );
      }
      setFailed(true);
      return;
    }

    // If the SDK is already loaded (from a previous AdBanner on another page),
    // we're ready immediately.
    if (sharedAds) {
      setReady(true);
      return;
    }
    if (sharedFailed) {
      setFailed(true);
      setReady(true);
      return;
    }

    let mounted = true;
    void ensureSdkReady().then(() => {
      if (!mounted) return;
      if (sharedAds) {
        setReady(true);
      } else {
        setFailed(true);
        setReady(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  // No SDK, failed import, or the ad failed to load -> render nothing.
  if (failed || !ready || !sharedAds || sharedConsent !== 'granted') {
    return null;
  }

  const { BannerAd, BannerAdSize } = sharedAds;

  // Only render the BannerAd; no placeholder, no wrapper bar.
  // When the ad loads it appears; until then nothing is shown.
  return (
    <BannerAd
      unitId={BANNER_UNIT_ID}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      onAdLoaded={() => {
        if (__DEV__) {
          console.log(`${LOG} ad loaded successfully ✅ (unit ${BANNER_UNIT_ID})`);
        }
        setLoaded(true);
      }}
      onAdFailedToLoad={(error: Error & { code?: string | number }) => {
        if (__DEV__) {
          console.warn(
            `${LOG} ad FAILED to load ❌ code=${error?.code ?? 'n/a'} message=${
              error?.message ?? 'n/a'
            }`,
          );
        }
        setLoaded(false);
        setFailed(true);
      }}
    />
  );
}
