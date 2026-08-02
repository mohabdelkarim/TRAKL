import type { ConfigContext, ExpoConfig } from '@expo/config';

type ExpoPlugins = NonNullable<ExpoConfig['plugins']>;

const CURRENT_VERSION_CODE = 22;

function requireEnv(name: string, fallback: string): string {
  // oxlint-disable-next-line expo/no-dynamic-env-var
  const value = process.env[name];
  return value ?? fallback;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const nativePlugins: ExpoPlugins = [
    'expo-dev-client',
  ];

  const appVersion = requireEnv('TRAKL_APP_VERSION', '1.0.9');
  const androidPackage = requireEnv('TRAKL_ANDROID_PACKAGE', 'com.example.trakl');
  const iosBundleId = requireEnv('TRAKL_IOS_BUNDLE_ID', 'com.example.trakl');
  const androidVersionCode = Number(
    requireEnv('TRAKL_ANDROID_VERSION_CODE', String(CURRENT_VERSION_CODE)),
  );

  if (!Number.isInteger(androidVersionCode) || androidVersionCode <= 0) {
    throw new Error(
      `Invalid TRAKL_ANDROID_VERSION_CODE: ${androidVersionCode}. Must be a positive integer.`,
    );
  }

  return {
    ...config,
    owner: requireEnv('TRAKL_EXPO_OWNER', 'your-expo-account'),
    name: 'TRAKL',
    slug: 'trakl',
    version: appVersion,
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    scheme: 'trakl',
    icon: './assets/logo.png',
    updates: {
      enabled: false,
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
      supportsTablet: true,
      bundleIdentifier: iosBundleId,
    },
    android: {
      package: androidPackage,
      // Bump on every Play Console release (must be > previously uploaded versionCode).
      versionCode: androidVersionCode,
      // permissions: ['com.google.android.gms.permission.AD_ID'] — re-enable with AdMob
    },
    extra: {
      appStoreAppId: process.env.TRAKL_APP_STORE_APP_ID,
      eas: {
        projectId: requireEnv('TRAKL_EAS_PROJECT_ID', '00000000-0000-0000-0000-000000000000'),
      },
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-localization',
      [
        'expo-notifications',
        {
          icon: './assets/logo.png',
          color: '#f0c061',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'TRAKL needs access to your photos so you can set a profile picture.',
        },
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/splash.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#f0c061',
        },
      ],
      [
        'react-native-google-mobile-ads',
        {
          androidAppId: requireEnv('TRAKL_ADMOB_ANDROID_APP_ID', 'ca-app-pub-3940256099942544~3347511713'),
          iosAppId: requireEnv('TRAKL_ADMOB_IOS_APP_ID', 'ca-app-pub-3940256099942544~1458002511'),
        },
      ],
      ...nativePlugins,
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: false,
    },
  };
};
