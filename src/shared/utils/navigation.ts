import { type Href, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { TRACKER_MAP, type TrackerKey } from '@/src/domain/trackers';

/**
 * Type-safe navigation helper for tracker routes.
 *
 * expo-router's `typedRoutes: true` experiment already validates
 * `router.push()` calls at compile time. This helper adds a convenience
 * layer for tracker-specific navigation, ensuring only valid TrackerKey
 * values can be used.
 */
export function useTrackerNav() {
  const router = useRouter();

  const navigateToTracker = useCallback(
    (key: TrackerKey) => {
      const meta = TRACKER_MAP[key];
      router.push(meta.route as Href);
    },
    [router],
  );

  const navigateToCustomTracker = useCallback(
    (id: string) => {
      router.push({ pathname: '/tracker/custom/[id]', params: { id } });
    },
    [router],
  );

  return { navigateToTracker, navigateToCustomTracker };
}
