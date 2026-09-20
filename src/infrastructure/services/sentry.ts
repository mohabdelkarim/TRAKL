import { Platform } from 'react-native';

/**
 * Initialize Sentry for native builds when SENTRY_DSN is set and
 * @sentry/react-native is installed. Otherwise this is a no op.
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
