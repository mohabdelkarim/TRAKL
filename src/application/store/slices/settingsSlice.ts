import type { StateCreator } from 'zustand';
import type { ParseKeys } from 'i18next';

import type { TraklState, SettingsSlice } from '../types';
import {
  ALL_TRACKERS,
  EMPTY_DATA,
  MONTHLY_BUDGET,
  RETENTION_DEFAULTS,
  WATER_GOAL,
  defaultProfile,
} from '../types';
import {
  saveTransactionsSecure,
  deleteTransactionsSecure,
} from '@/src/infrastructure/storage/secureStorage';
import { createBackup, parseBackup } from '@/src/application/backup';
import i18n from '@/src/infrastructure/services/i18n';
import {
  buildCustom,
  buildGoals,
  buildHabits,
  buildMeditation,
  buildMood,
  buildNotifications,
  buildPlanner,
  buildTasks,
  buildTransactions,
  buildWorkouts,
  seedAchievements,
  seedSleep,
  seedWater,
  seedWeight,
} from '@/src/application/seed';

/** Translate a sample-data key in the currently-active language. */
const sampleT = (key: ParseKeys) => {
  const lng = i18n.resolvedLanguage ?? i18n.language ?? 'en';
  return i18n.getFixedT(lng)(key);
};

/** All the seed/demo content, used by the optional "Try with sample data" flow. */
function buildSampleData() {
  const t = sampleT;
  return {
    transactions: buildTransactions(t),
    habits: buildHabits(t),
    tasks: buildTasks(t),
    goals: buildGoals(t),
    planner: buildPlanner(t),
    sleep: seedSleep,
    workouts: buildWorkouts(t),
    mood: buildMood(t),
    water: seedWater,
    weight: seedWeight,
    meditation: buildMeditation(t),
    customTrackers: buildCustom(t),
    notifications: buildNotifications(t),
    achievements: seedAchievements,
    monthlyBudget: 1600,
  };
}

export const createSettingsSlice: StateCreator<TraklState, [], [], SettingsSlice> = (set, get) => ({
  hydrated: false,
  rehydrateFailed: false,
  onboarded: false,
  enabledTrackers: [...ALL_TRACKERS],
  pinnedTrackers: [],
  profile: defaultProfile,
  achievements: [],
  notificationsEnabled: true,
  ...RETENTION_DEFAULTS,
  retentionNotifiedAchievementIds: [],
  retentionLastInactivityNotificationAt: undefined,
  waterGoal: WATER_GOAL,

  completeOnboarding: ({ profile, trackers, sampleData }) =>
    set((s) => ({
      onboarded: true,
      profile: {
        ...s.profile,
        ...profile,
        memberSince: new Date().toISOString(),
      },
      enabledTrackers: trackers.length > 0 ? trackers : s.enabledTrackers,
      ...(sampleData ? buildSampleData() : EMPTY_DATA),
      retentionNotifiedAchievementIds: sampleData
        ? seedAchievements.filter((achievement) => achievement.unlocked).map((achievement) => achievement.id)
        : [],
    })),

  loadSampleData: () => {
    const data = buildSampleData();
    void saveTransactionsSecure(data.transactions);
    set({
      ...data,
      retentionNotifiedAchievementIds: data.achievements
        .filter((achievement) => achievement.unlocked)
        .map((achievement) => achievement.id),
    });
  },

  clearAllData: () => {
    void deleteTransactionsSecure();
    set({ ...EMPTY_DATA, pinnedTrackers: [], monthlyBudget: 0 });
  },

  exportAppData: () => createBackup(get()),

  importAppData: (json) => {
    const result = parseBackup(json);
    if (!result.ok) {
      return { success: false, message: result.error };
    }
    const data = result.data;
    set({
      onboarded: true,
      hydrated: true,
      rehydrateFailed: false,
      enabledTrackers: data.enabledTrackers,
      pinnedTrackers: data.pinnedTrackers,
      profile: data.profile,
      transactions: data.transactions,
      habits: data.habits,
      tasks: data.tasks,
      goals: data.goals,
      planner: data.planner,
      sleep: data.sleep,
      workouts: data.workouts,
      mood: data.mood,
      water: data.water,
      weight: data.weight,
      meditation: data.meditation,
      customTrackers: data.customTrackers,
      notifications: data.notifications,
      achievements: data.achievements,
      monthlyBudget: data.monthlyBudget,
      notificationsEnabled: data.notificationsEnabled,
      retentionNotificationsEnabled: data.retentionNotificationsEnabled,
      quietHoursEnabled: data.quietHoursEnabled,
      quietHoursStart: data.quietHoursStart,
      quietHoursEnd: data.quietHoursEnd,
      retentionNotifiedAchievementIds: data.retentionNotifiedAchievementIds,
      retentionLastInactivityNotificationAt: data.retentionLastInactivityNotificationAt,
      waterGoal: data.waterGoal,
    });
    void saveTransactionsSecure(data.transactions);
    return { success: true, message: 'Backup restored successfully.' };
  },

  setEnabledTrackers: (keys) => set({ enabledTrackers: keys }),

  toggleTracker: (key) =>
    set((s) => ({
      enabledTrackers: s.enabledTrackers.includes(key)
        ? s.enabledTrackers.filter((k) => k !== key)
        : [...s.enabledTrackers, key],
    })),

  togglePinTracker: (key) =>
    set((s) => ({
      pinnedTrackers: s.pinnedTrackers.includes(key)
        ? s.pinnedTrackers.filter((k) => k !== key)
        : [...s.pinnedTrackers, key],
    })),

  updateProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),

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

  resetApp: () => {
    void deleteTransactionsSecure();
    set({
      onboarded: false,
      profile: defaultProfile,
      enabledTrackers: [...ALL_TRACKERS],
      pinnedTrackers: [],
      ...EMPTY_DATA,
      monthlyBudget: MONTHLY_BUDGET,
      notificationsEnabled: true,
      ...RETENTION_DEFAULTS,
      retentionNotifiedAchievementIds: [],
      retentionLastInactivityNotificationAt: undefined,
      waterGoal: WATER_GOAL,
    });
  },
});
