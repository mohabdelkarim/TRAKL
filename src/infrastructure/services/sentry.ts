import { Platform } from 'react-native';

/**
 * Initialize Sentry crash reporting for native platforms (iOS/Android).
 * Web uses PostHog instead (see posthog.ts).
 *
 * Requires @sentry/react-native to be installed:
 *   npx expo install @sentry/react-native
 *
 * And a SENTRY_DSN environment variable set in EAS Build / CI secrets.
 * If SENTRY_DSN is not set or the package is not installed, this is a no-op.
 */
export async function initSentry() {
  if (Platform.OS === 'web') return;

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    if (__DEV__) {
      console.info('[TRAKL] SENTRY_DSN not set; crash reporting disabled');
    }
    return;
  }

  try {
    const Sentry = await import('@sentry/react-native');
    Sentry.init({
      dsn,
      enableInExpoDevelopment: false,
      debug: __DEV__,
      tracesSampleRate: 0.2,
    });
  } catch {
    if (__DEV__) {
      console.warn('[TRAKL] @sentry/react-native not installed; crash reporting disabled');
    }
  }
}
