import type { StateCreator } from 'zustand';

import type { TraklState, BackupSlice } from '../types';
import { EMPTY_DATA } from '../types';
import {
  saveTransactionsSecure,
  deleteTransactionsSecure,
} from '@/src/infrastructure/storage/secureStorage';
import { createBackup, parseBackup } from '@/src/application/backup';
import { buildSampleData } from './settingsSlice';

export const createBackupSlice: StateCreator<TraklState, [], [], BackupSlice> = (set, get) => ({
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
    try {
      saveTransactionsSecure(data.transactions);
    } catch {
      return { success: false, message: 'Failed to save transactions securely.' };
    }
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
    return { success: true, message: 'Backup restored successfully.' };
  },
});
