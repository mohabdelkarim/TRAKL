import type { TrackerKey } from '@/src/domain/trackers';
import type {
  Achievement,
  AppNotification,
  CustomTracker,
  Goal,
  Habit,
  MeditationSession,
  MoodEntry,
  PlannerEvent,
  Profile,
  SleepEntry,
  Task,
  Transaction,
  WaterEntry,
  WeightEntry,
  Workout,
} from '@/src/domain/types';

// Constants

const MONTHLY_BUDGET = 0;

export const RETENTION_DEFAULTS = {
  retentionNotificationsEnabled: true,
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
} as const;

const ALL_TRACKERS: TrackerKey[] = [
  'finance',
  'habits',
  'tasks',
  'goals',
  'planner',
  'sleep',
  'fitness',
  'mood',
  'water',
  'weight',
  'meditation',
  'custom',
];

/** Daily water goal in glasses. */
export const WATER_GOAL = 8;

// Shared helpers

/** Recompute goal progress from completed milestones (0-100). */
export function progressFromMilestones(milestones: Goal['milestones']): number {
  if (milestones.length === 0) return 0;
  const done = milestones.filter((m) => m.done).length;
  return Math.round((done / milestones.length) * 100);
}

export const defaultProfile: Profile = {
  name: '',
  avatarEmoji: '🦊',
  language: '',
  focus: 'all',
  memberSince: new Date().toISOString(),
};

/** A brand-new user starts with everything empty (no demo numbers). */
export const EMPTY_DATA = {
  transactions: [] as Transaction[],
  habits: [] as Habit[],
  tasks: [] as Task[],
  goals: [] as Goal[],
  planner: [] as PlannerEvent[],
  sleep: [] as SleepEntry[],
  workouts: [] as Workout[],
  mood: [] as MoodEntry[],
  water: [] as WaterEntry[],
  weight: [] as WeightEntry[],
  meditation: [] as MeditationSession[],
  customTrackers: [] as CustomTracker[],
  notifications: [] as AppNotification[],
  achievements: [] as Achievement[],
} as const;

export { ALL_TRACKERS, MONTHLY_BUDGET };

// Slice interfaces

export interface FinanceSlice {
  transactions: Transaction[];
  monthlyBudget: number;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  setMonthlyBudget: (budget: number) => void;
}

export interface HabitsSlice {
  habits: Habit[];
  toggleHabitToday: (id: string) => void;
  addHabit: (name: string, color: string) => void;
  updateHabit: (id: string, patch: { name: string; color: string }) => void;
  deleteHabit: (id: string) => void;
}

export interface TasksSlice {
  tasks: Task[];
  toggleTask: (id: string) => void;
  setTaskStatus: (id: string, status: Task['status']) => void;
  addTask: (t: Omit<Task, 'id' | 'done' | 'status'>) => void;
  deleteTask: (id: string) => void;
}

export interface GoalsSlice {
  goals: Goal[];
  addGoal: (name: string, deadline: string) => void;
  addGoalFull: (g: Omit<Goal, 'id' | 'progress'>) => void;
  updateGoal: (id: string, patch: Omit<Goal, 'id' | 'progress'>) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;
  deleteGoal: (id: string) => void;
}

export interface PlannerSlice {
  planner: PlannerEvent[];
  addPlannerEvent: (e: Omit<PlannerEvent, 'id'>) => void;
  deletePlannerEvent: (id: string) => void;
}

export interface HealthSlice {
  sleep: SleepEntry[];
  workouts: Workout[];
  mood: MoodEntry[];
  water: WaterEntry[];
  weight: WeightEntry[];
  meditation: MeditationSession[];
  addSleep: (entry: Omit<SleepEntry, 'id'>) => void;
  addWorkout: (w: Omit<Workout, 'id'>) => void;
  deleteWorkout: (id: string) => void;
  addMood: (entry: Omit<MoodEntry, 'id'>) => void;
  deleteMood: (id: string) => void;
  addWater: (glasses: number) => void;
  resetWaterToday: () => void;
  setWaterGoal: (goal: number) => void;
  addWeight: (kg: number) => void;
  deleteWeight: (id: string) => void;
  addMeditation: (entry: Omit<MeditationSession, 'id'>) => void;
  deleteMeditation: (id: string) => void;
}

export interface CustomSlice {
  customTrackers: CustomTracker[];
  addCustomTracker: (c: Omit<CustomTracker, 'id' | 'logs'>) => void;
  updateCustomTracker: (id: string, patch: Partial<Omit<CustomTracker, 'id' | 'logs'>>) => void;
  logCustomValue: (trackerId: string, value: number) => void;
  deleteCustomLog: (trackerId: string, logId: string) => void;
  deleteCustomTracker: (id: string) => void;
}

export interface NotificationsSlice {
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'read'>) => void;
  markAllNotificationsRead: () => void;
}

export interface SettingsSlice {
  hydrated: boolean;
  rehydrateFailed: boolean;
  onboarded: boolean;
  enabledTrackers: TrackerKey[];
  pinnedTrackers: TrackerKey[];
  profile: Profile;
  achievements: Achievement[];
  notificationsEnabled: boolean;
  retentionNotificationsEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  retentionNotifiedAchievementIds: string[];
  retentionLastInactivityNotificationAt?: string;
  waterGoal: number;
  completeOnboarding: (data: {
    profile: Partial<Profile>;
    trackers: TrackerKey[];
    sampleData?: boolean;
  }) => void;
  loadSampleData: () => void;
  clearAllData: () => void;
  exportAppData: () => string;
  importAppData: (json: string) => { success: boolean; message: string };
  setEnabledTrackers: (keys: TrackerKey[]) => void;
  toggleTracker: (key: TrackerKey) => void;
  togglePinTracker: (key: TrackerKey) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setRetentionNotificationsEnabled: (enabled: boolean) => void;
  setQuietHoursEnabled: (enabled: boolean) => void;
  setQuietHours: (start: string, end: string) => void;
  markRetentionAchievementsNotified: (ids: string[]) => void;
  markRetentionInactivityScheduled: (at: string) => void;
  resetApp: () => void;
}

// Combined state

export type TraklState = FinanceSlice &
  HabitsSlice &
  TasksSlice &
  GoalsSlice &
  PlannerSlice &
  HealthSlice &
  CustomSlice &
  NotificationsSlice &
  SettingsSlice;
