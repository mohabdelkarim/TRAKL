import type { StateCreator } from 'zustand';

import type { TraklState, PreferencesSlice } from '../types';
import { RETENTION_DEFAULTS, WATER_GOAL } from '../types';

function sameIdSet(current: string[], incoming: string[]): boolean {
  if (incoming.every((id) => current.includes(id))) return true;
  return false;
}

export const createPreferencesSlice: StateCreator<TraklState, [], [], PreferencesSlice> = (set) => ({
  notificationsEnabled: true,
  ...RETENTION_DEFAULTS,
  retentionNotifiedAchievementIds: [],
  retentionLastInactivityNotificationAt: undefined,
  waterGoal: WATER_GOAL,
  exitConfirmEnabled: true,
  ratePromptNever: false,
  ratePromptPending: false,
  ratePromptCount: 0,
  ratePromptLastAt: undefined,

  setNotificationsEnabled: (enabled) =>
    set((s) => (s.notificationsEnabled === enabled ? s : { notificationsEnabled: enabled })),
  setRetentionNotificationsEnabled: (enabled) =>
    set((s) =>
      s.retentionNotificationsEnabled === enabled ? s : { retentionNotificationsEnabled: enabled },
    ),
  setQuietHoursEnabled: (enabled) =>
    set((s) => (s.quietHoursEnabled === enabled ? s : { quietHoursEnabled: enabled })),
  setQuietHours: (start, end) =>
    set((s) =>
      s.quietHoursStart === start && s.quietHoursEnd === end
        ? s
        : { quietHoursStart: start, quietHoursEnd: end },
    ),
  setExitConfirmEnabled: (enabled) =>
    set((s) => (s.exitConfirmEnabled === enabled ? s : { exitConfirmEnabled: enabled })),
  dismissRatePrompt: (opts) =>
    set((s) => {
      const never = Boolean(opts?.never);
      if (!s.ratePromptPending && (!never || s.ratePromptNever)) return s;
      return {
        ratePromptPending: false,
        ...(never ? { ratePromptNever: true } : {}),
      };
    }),
  markRetentionAchievementsNotified: (ids) =>
    set((s) => {
      if (ids.length === 0 || sameIdSet(s.retentionNotifiedAchievementIds, ids)) return s;
      return {
        retentionNotifiedAchievementIds: Array.from(
          new Set([...s.retentionNotifiedAchievementIds, ...ids]),
        ),
      };
    }),
  markRetentionInactivityScheduled: (at) =>
    set((s) =>
      s.retentionLastInactivityNotificationAt === at
        ? s
        : { retentionLastInactivityNotificationAt: at },
    ),
});
