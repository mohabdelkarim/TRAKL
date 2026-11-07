import type { ConfigContext, ExpoConfig } from '@expo/config';

type ExpoPlugins = NonNullable<ExpoConfig['plugins']>;

const CURRENT_VERSION_CODE = 22;

const PLACEHOLDER_BUNDLE = 'com.example.trakl';
const PLACEHOLDER_OWNER = 'your-expo-account';
const PLACEHOLDER_EAS = '00000000-0000-0000-0000-000000000000';

function requireEnv(name: string, fallback: string): string {
  // oxlint-disable-next-line expo/no-dynamic-env-var
  const value = process.env[name];
  return value ?? fallback;
}

function isFlagEnabled(name: string): boolean {
  // oxlint-disable-next-line expo/no-dynamic-env-var
  const value = process.env[name];
  if (value === undefined) return false;
  return ['1', 'true', 'yes'].includes(value.trim().toLowerCase());
}

function isReleaseBuild(): boolean {
  // oxlint-disable-next-line expo/no-dynamic-env-var
  const profile = process.env.EAS_BUILD_PROFILE ?? '';
  // oxlint-disable-next-line expo/no-dynamic-env-var
  return profile === 'production' || process.env.TRAKL_REQUIRE_RELEASE_IDS === '1';
}

export default ({ config }: ConfigContext): ExpoConfig => {
  // Keep expo-dev-client out of default Expo Go sessions. Opt in with TRAKL_DEV_CLIENT=1.
  const includeDevClient = isFlagEnabled('TRAKL_DEV_CLIENT');
  const nativePlugins: ExpoPlugins = includeDevClient ? ['expo-dev-client'] : [];

  const appVersion = requireEnv('TRAKL_APP_VERSION', '1.0.9');
  const androidPackage = requireEnv('TRAKL_ANDROID_PACKAGE', PLACEHOLDER_BUNDLE);
  const iosBundleId = requireEnv('TRAKL_IOS_BUNDLE_ID', PLACEHOLDER_BUNDLE);
  const expoOwner = requireEnv('TRAKL_EXPO_OWNER', PLACEHOLDER_OWNER);
  const easProjectId = requireEnv('TRAKL_EAS_PROJECT_ID', PLACEHOLDER_EAS);
  const androidVersionCode = Number(
    requireEnv('TRAKL_ANDROID_VERSION_CODE', String(CURRENT_VERSION_CODE)),
  );

  if (!Number.isInteger(androidVersionCode) || androidVersionCode <= 0) {
    throw new Error(
      `Invalid TRAKL_ANDROID_VERSION_CODE: ${androidVersionCode}. Must be a positive integer.`,
    );
  }

  const appStoreAppId = process.env.TRAKL_APP_STORE_APP_ID ?? '6800000662';

  if (isReleaseBuild()) {
    if (androidPackage === PLACEHOLDER_BUNDLE || iosBundleId === PLACEHOLDER_BUNDLE) {
      throw new Error('Release build requires TRAKL_ANDROID_PACKAGE / TRAKL_IOS_BUNDLE_ID.');
    }
    if (expoOwner === PLACEHOLDER_OWNER) {
      throw new Error('Release build requires TRAKL_EXPO_OWNER.');
    }
    if (easProjectId === PLACEHOLDER_EAS) {
      throw new Error('Release build requires TRAKL_EAS_PROJECT_ID.');
    }
    if (!process.env.TRAKL_APP_STORE_APP_ID?.trim()) {
      throw new Error('Release build requires TRAKL_APP_STORE_APP_ID.');
    }
  }

  return {
    ...config,
    owner: expoOwner,
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
      privacyManifests: {
        NSPrivacyAccessedAPITypes: [
          {
            NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
            NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
          },
          {
            NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
            NSPrivacyAccessedAPITypeReasons: ['C617.1'],
          },
          {
            NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace',
            NSPrivacyAccessedAPITypeReasons: ['E174.1'],
          },
          {
            NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime',
            NSPrivacyAccessedAPITypeReasons: ['35F9.1'],
          },
        ],
      },
    },
    android: {
      package: androidPackage,
      versionCode: androidVersionCode,
    },
    extra: {
      appStoreAppId,
      playStorePackage: androidPackage === PLACEHOLDER_BUNDLE ? 'trakl.app' : androidPackage,
      eas: {
        projectId: easProjectId,
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
      ...nativePlugins,
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: false,
    },
  };
};
