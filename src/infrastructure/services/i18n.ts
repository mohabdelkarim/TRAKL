import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { initReactI18next } from 'react-i18next';
import { I18nManager, Platform } from 'react-native';
import * as Updates from 'expo-updates';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { LANGUAGE_BY_CODE, LANGUAGES } from './languages';
import { en } from './locales/en';
import * as I18nModule from 'i18next';

// i18next ESM/CJS interop:
// - Metro (ESM): `import * as I18nModule` gives namespace with `createInstance` as named export.
// - Node.js/Jest (CJS): `require('i18next')` returns the instance directly, so
//   `I18nModule.createInstance` is a method on the instance.
// - Metro interop may wrap ESM default in `{ default: instance }`.
const createInstance =
  typeof I18nModule.createInstance === 'function'
    ? I18nModule.createInstance
    : (I18nModule as unknown as { default: { createInstance: () => typeof I18nModule } }).default
        .createInstance;

// The instance type from createInstance doesn't include dynamically-added store
// methods (addResourceBundle, etc.) that i18next adds during init(). We cast to
// include them for type safety in ensureLocaleLoaded/changeLanguage below.
type I18nInstance = ReturnType<typeof createInstance> & {
  addResourceBundle(
    lng: string,
    ns: string,
    resources: Record<string, unknown>,
    deep?: boolean,
    overwrite?: boolean,
  ): void;
  resolvedLanguage?: string;
  language: string;
};

const i18n = createInstance() as I18nInstance;

const STORAGE_KEY = 'trakl-language-v1';

// Only English is loaded eagerly as the fallback. All other locales are
// loaded on demand via dynamic import + addResourceBundle in initI18n /
// changeLanguage. This cuts ~19 bundle evaluations from the boot path.
const EAGER_RESOURCES = {
  en: { translation: en },
} as const;

const SUPPORTED = LANGUAGES.map((l) => l.code);

/** Pick the best initial language: stored choice → device locale → English. */
async function resolveInitialLanguage(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
  } catch {
    // ignore read errors, fall through to device locale
  }
  const device = Localization.getLocales()[0]?.languageCode ?? 'en';
  return SUPPORTED.includes(device) ? device : 'en';
}

/** Apply RTL/LTR layout direction for the active language. */
export function applyDirection(code: string) {
  const isRTL = LANGUAGE_BY_CODE[code]?.rtl ?? false;
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
    // A full reload is required for the direction flip to take visual effect
    // on native; on web it applies immediately.
  }
}

/** Track which locale bundles have been loaded to avoid redundant imports. */
const loadedLocales = new Set<string>(['en']);

/**
 * Lazy importers for non-English locales. Each function is a dynamic import
 * that Metro/Hermes will code-split into a separate bundle. The module is
 * only evaluated when the function is called, not at startup.
 */
const LAZY_LOCALES: Record<string, () => Promise<Record<string, unknown>>> = {
  ar: () => import('./locales/ar'),
  bn: () => import('./locales/bn'),
  de: () => import('./locales/de'),
  el: () => import('./locales/el'),
  es: () => import('./locales/es'),
  fr: () => import('./locales/fr'),
  hi: () => import('./locales/hi'),
  id: () => import('./locales/id'),
  it: () => import('./locales/it'),
  ja: () => import('./locales/ja'),
  ko: () => import('./locales/ko'),
  nl: () => import('./locales/nl'),
  pl: () => import('./locales/pl'),
  pt: () => import('./locales/pt'),
  ru: () => import('./locales/ru'),
  tr: () => import('./locales/tr'),
  ur: () => import('./locales/ur'),
  vi: () => import('./locales/vi'),
  zh: () => import('./locales/zh'),
};

/**
 * Dynamically import a locale bundle and register it with i18next.
 * No-op for 'en' (already eager) or already-loaded locales.
 */
async function ensureLocaleLoaded(code: string): Promise<void> {
  if (loadedLocales.has(code)) return;
  if (!SUPPORTED.includes(code)) return;

  const loader = LAZY_LOCALES[code];
  if (!loader) return;

  try {
    const mod = await loader();
    const bundle = mod[code] as Record<string, unknown>;
    if (bundle) {
      // oxlint-disable-next-line import/no-named-as-default-member
      i18n.addResourceBundle(code, 'translation', bundle, true, false);
      loadedLocales.add(code);
    } else if (__DEV__) {
      console.warn(`[i18n] Locale "${code}" loaded but export key "${code}" not found`);
    }
  } catch (error) {
    if (__DEV__) console.warn(`[i18n] Failed to load locale "${code}":`, error);
    // Fall back to English — i18next will use fallbackLng for missing keys
  }
}

let initialized = false;

export async function initI18n() {
  if (initialized) return i18n;

  const lng = await resolveInitialLanguage();

  applyDirection(lng);

  // init() must be called before ensureLocaleLoaded() because i18next
  // dynamically adds store API methods (addResourceBundle, etc.) to the
  // instance during init(). Calling addResourceBundle before init() throws
  // "i18n.addResourceBundle is not a function".
  // partialBundledLanguages: true lets the app start with English fallback
  // while non-English locales are loaded and added after init().
  await i18n.use(initReactI18next).init({
    resources: EAGER_RESOURCES,
    lng,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED,
    interpolation: { escapeValue: false },
    returnNull: false,
    partialBundledLanguages: true,
  });

  // After init(), addResourceBundle is available — load the target locale.
  if (lng !== 'en') {
    await ensureLocaleLoaded(lng);
  }

  // Only mark as initialized after successful completion so a failed init
  // can be retried by a subsequent call.
  initialized = true;

  return i18n;
}

/** Change the active language, persist it, and apply layout direction. */
export async function changeLanguage(code: string) {
  if (!SUPPORTED.includes(code)) return;

  // Lazy-load the target locale before switching.
  await ensureLocaleLoaded(code);

  // oxlint-disable-next-line import/no-named-as-default-member
  await i18n.changeLanguage(code);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, code);
  } catch {
    // non-fatal: persistence failure shouldn't block the switch
  }
  applyDirection(code);
  // On native, reload the app to apply RTL/LTR layout changes visually.
  // On web, layout changes apply immediately via CSS.
  // Skip reload in Expo Go — Updates.reloadAsync() throws a native bridge
  // error there. Users in Expo Go can restart manually if needed.
  if (Platform.OS !== 'web') {
    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    if (isExpoGo) return;
    try {
      await Updates.reloadAsync();
    } catch (error) {
      if (__DEV__) {
        console.warn('[i18n] Failed to reload app for RTL/LTR change:', error);
      }
    }
  }
}

export default i18n;
