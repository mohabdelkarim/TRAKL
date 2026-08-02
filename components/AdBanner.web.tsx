/**
 * Web fallback for the AdMob banner. The native ad SDK
 * (react-native-google-mobile-ads) has no web implementation, so on web
 * we render nothing.
 */
export function AdBanner() {
  return null;
}
