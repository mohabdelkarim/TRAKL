// oxlint-disable-next-line eslint-plugin-import/no-unassigned-import
import '../global.css';

import { Platform } from 'react-native';
import { useEffect, useState } from 'react';
import {
  ErrorBoundary as ExpoErrorBoundary,
  type ErrorBoundaryProps,
  SplashScreen,
  Stack,
} from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HeroUINativeProvider } from 'heroui-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { ClashDisplayFonts } from '@/src/shared/fonts';
import { initI18n } from '@/src/infrastructure/services/i18n';
import { initPostHog } from '@/src/infrastructure/services/posthog';
import { reportErrorToParent } from '@/src/shared/reportPreviewError';
import { useColors, useThemeSync } from '@/src/shared/theme';
import { useReminderSync } from '@/src/application/hooks/useReminderSync';
import { useTransactionSync } from '@/src/application/hooks/useTransactionSync';

function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    if (Platform.OS === 'web' && error) {
      const message = [error.message, error.stack].filter(Boolean).join('\n');
      reportErrorToParent(message);
    }
  }, [error]);
  return <ExpoErrorBoundary error={error} retry={retry} />;
}

export { ErrorBoundary };

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [i18nReady, setI18nReady] = useState(false);

  const [, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    ...ClashDisplayFonts,
  });

  useEffect(() => {
    if (__DEV__ && fontError) console.warn('[layout] Font loading error:', fontError);
  }, [fontError]);

  useEffect(() => {
    let timeout = setTimeout(() => {
      if (__DEV__) console.warn('[layout] i18n init timeout — proceeding without i18n');
      setI18nReady(true);
    }, 4000);
    void initI18n()
      .then(() => {
        clearTimeout(timeout);
        setI18nReady(true);
      })
      .catch((err) => {
        clearTimeout(timeout);
        if (__DEV__) console.warn('[layout] i18n init failed — proceeding with fallback:', err);
        setI18nReady(true);
      });
    return () => clearTimeout(timeout);
  }, []);

  // Hide native splash only after i18n is ready so the real splash screen
  // (splash.png) stays visible during init instead of flashing the logo.
  useEffect(() => {
    if (i18nReady) {
      void SplashScreen.hideAsync().catch(() => {});
    }
  }, [i18nReady]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;

    const handleError = (event: ErrorEvent) => {
      const message = event.error?.stack ?? event.message ?? 'Unknown error';
      reportErrorToParent(message);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const err = event.reason;
      const message =
        err instanceof Error ? [err.message, err.stack].filter(Boolean).join('\n') : String(err);
      reportErrorToParent(message);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const existingLink = document.querySelector(
        'link[href*="fonts.googleapis.com/css2?family=Inter"]',
      );
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }

      const existingClash = document.querySelector('link[href*="api.fontshare.com"]');
      if (!existingClash) {
        const clash = document.createElement('link');
        clash.rel = 'stylesheet';
        clash.href =
          'https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap';
        document.head.appendChild(clash);
      }
    }
  }, []);

  useEffect(() => {
    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    if (!(__DEV__ && Platform.OS !== 'web' && !isExpoGo)) return undefined;

    let DevClient: typeof import('expo-dev-client') | null = null;
    try {
      DevClient = require('expo-dev-client');
    } catch {
      return undefined;
    }
    if (!DevClient) return undefined;
    const timer = setTimeout(() => {
      DevClient?.closeMenu();
      DevClient?.hideMenu();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      initPostHog();
    }
  }, []);

  if (!i18nReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
        <RootStack />
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}

function RootStack() {
  useThemeSync();
  useReminderSync();
  useTransactionSync();
  const colors = useColors();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="tracker/finance" />
      <Stack.Screen name="tracker/habits" />
      <Stack.Screen name="tracker/tasks" />
      <Stack.Screen name="tracker/goals" />
      <Stack.Screen name="tracker/planner" />
      <Stack.Screen name="tracker/sleep" />
      <Stack.Screen name="tracker/fitness" />
      <Stack.Screen name="tracker/mood" />
      <Stack.Screen name="tracker/water" />
      <Stack.Screen name="tracker/weight" />
      <Stack.Screen name="tracker/meditation" />
      <Stack.Screen name="tracker/custom" />
      <Stack.Screen name="tracker/custom/[id]" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="achievements" />
      <Stack.Screen name="weekly-review" />
      <Stack.Screen name="search" />
      <Stack.Screen
        name="quick-add"
        options={{
          presentation: 'transparentModal',
          animation: 'none',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </Stack>
  );
}
