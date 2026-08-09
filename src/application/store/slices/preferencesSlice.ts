import type { StateCreator } from 'zustand';

import type { TraklState, PreferencesSlice } from '../types';
import { RETENTION_DEFAULTS, WATER_GOAL } from '../types';

export const createPreferencesSlice: StateCreator<TraklState, [], [], PreferencesSlice> = (set) => ({
  notificationsEnabled: true,
  ...RETENTION_DEFAULTS,
  retentionNotifiedAchievementIds: [],
  retentionLastInactivityNotificationAt: undefined,
  waterGoal: WATER_GOAL,

  setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
  setRetentionNotificationsEnabled: (enabled) =>
    set({ retentionNotificationsEnabled: enabled }),
  setQuietHoursEnabled: (enabled) => set({ quietHoursEnabled: enabled }),
  setQuietHours: (start, end) => set({ quietHoursStart: start, quietHoursEnd: end }),
  markRetentionAchievementsNotified: (ids) =>
    set((s) => ({
      retentionNotifiedAchievementIds: Array.from(
        new Set([...s.retentionNotifiedAchievementIds, ...ids]),
      ),
    })),
  markRetentionInactivityScheduled: (at) => set({ retentionLastInactivityNotificationAt: at }),
});
