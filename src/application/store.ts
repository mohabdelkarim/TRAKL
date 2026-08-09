import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { TraklState } from './store/types';
import { RETENTION_DEFAULTS, WATER_GOAL } from './store/types';
import { migrate } from './store/migrations';
import { createFinanceSlice } from './store/slices/financeSlice';
import { createHabitsSlice } from './store/slices/habitsSlice';
import { createTasksSlice } from './store/slices/tasksSlice';
import { createGoalsSlice } from './store/slices/goalsSlice';
import { createPlannerSlice } from './store/slices/plannerSlice';
import { createHealthSlice } from './store/slices/healthSlice';
import { createCustomSlice } from './store/slices/customSlice';
import { createNotificationsSlice } from './store/slices/notificationsSlice';
import { createSettingsSlice } from './store/slices/settingsSlice';

export const useTrakl = create<TraklState>()(
  persist(
    (...a) => ({
      ...createFinanceSlice(...a),
      ...createHabitsSlice(...a),
      ...createTasksSlice(...a),
      ...createGoalsSlice(...a),
      ...createPlannerSlice(...a),
      ...createHealthSlice(...a),
      ...createCustomSlice(...a),
      ...createNotificationsSlice(...a),
      ...createSettingsSlice(...a),
    }),
    {
      name: 'trakl-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 11,
      migrate,
      // Transactions are intentionally excluded from partialize; they are
      // stored in encrypted secure storage (expo-secure-store) instead.
      partialize: (s) => ({
        onboarded: s.onboarded,
        enabledTrackers: s.enabledTrackers,
        pinnedTrackers: s.pinnedTrackers,
        profile: s.profile,
        habits: s.habits,
        tasks: s.tasks,
        goals: s.goals,
        planner: s.planner,
        sleep: s.sleep,
        workouts: s.workouts,
        mood: s.mood,
        water: s.water,
        weight: s.weight,
        meditation: s.meditation,
        customTrackers: s.customTrackers,
        notifications: s.notifications,
        achievements: s.achievements,
        monthlyBudget: s.monthlyBudget,
        notificationsEnabled: s.notificationsEnabled,
        retentionNotificationsEnabled: s.retentionNotificationsEnabled,
        quietHoursEnabled: s.quietHoursEnabled,
        quietHoursStart: s.quietHoursStart,
        quietHoursEnd: s.quietHoursEnd,
        retentionNotifiedAchievementIds: s.retentionNotifiedAchievementIds,
        retentionLastInactivityNotificationAt: s.retentionLastInactivityNotificationAt,
        waterGoal: s.waterGoal,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          useTrakl.setState({ hydrated: true, rehydrateFailed: true });
          return;
        }
        useTrakl.setState({ hydrated: true });
      },
    },
  ),
);

export type { TraklState } from './store/types';
export { RETENTION_DEFAULTS, WATER_GOAL };
