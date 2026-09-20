import { useCallback, useEffect, useState } from 'react';
import { BackHandler, Platform } from 'react-native';
import { usePathname, useRouter } from 'expo-router';

import { useTrakl } from '@/src/application/store';

const TAB_PATHS = new Set(['/', '/index', '/trackers', '/analytics', '/profile']);

function isHomePath(pathname: string): boolean {
  return pathname === '/' || pathname === '/index';
}

function isTabsRootPath(pathname: string): boolean {
  return TAB_PATHS.has(pathname);
}

/**
 * Android hardware back on the tabs root only (not tracker/detail stacks):
 * - non-Home tab → switch to Home
 * - Home + exitConfirmEnabled → show confirm sheet (caller renders UI)
 * - Home + confirm off → allow default exit
 */
export function useAndroidExitConfirm() {
  const router = useRouter();
  const pathname = usePathname();
  const exitConfirmEnabled = useTrakl((s) => s.exitConfirmEnabled);
  const [exitOpen, setExitOpen] = useState(false);

  const closeExit = useCallback(() => setExitOpen(false), []);
  const confirmExit = useCallback(() => {
    setExitOpen(false);
    BackHandler.exitApp();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      // Let stack screens (trackers, sheets, modals) handle their own back.
      if (!isTabsRootPath(pathname)) return false;

      if (!isHomePath(pathname)) {
        router.navigate('/(tabs)');
        return true;
      }
      if (exitConfirmEnabled) {
        setExitOpen(true);
        return true;
      }
      return false;
    });

    return () => sub.remove();
  }, [pathname, exitConfirmEnabled, router]);

  return { exitOpen, closeExit, confirmExit };
}
