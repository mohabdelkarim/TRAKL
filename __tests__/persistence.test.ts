import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { useTrakl } from '@/src/application/store';

// Mock secureStorage so store actions don't try to access native modules
jest.mock('@/src/infrastructure/storage/secureStorage', () => ({
  saveTransactionsSecure: jest.fn(() => Promise.resolve()),
  deleteTransactionsSecure: jest.fn(() => Promise.resolve()),
  getTransactionsSecure: jest.fn(() => Promise.resolve([])),
}));

describe('Persistence: partialize config', () => {
  beforeEach(() => {
    useTrakl.setState({
      transactions: [],
      habits: [],
      tasks: [],
      goals: [],
      planner: [],
      sleep: [],
      workouts: [],
      mood: [],
      water: [],
      weight: [],
      meditation: [],
      customTrackers: [],
      notifications: [],
      achievements: [],
      monthlyBudget: 0,
    });
  });

  it('partialize should exclude transactions from persisted state', () => {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const store = useTrakl as unknown as {
      persist: { getOptions: () => { partialize: (s: unknown) => Record<string, unknown> } };
    };
    const options = store.persist.getOptions();
    const partialized = options.partialize(useTrakl.getState());

    expect(partialized).not.toHaveProperty('transactions');
  });

  it('partialize should include all non-sensitive persisted fields', () => {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const store = useTrakl as unknown as {
      persist: { getOptions: () => { partialize: (s: unknown) => Record<string, unknown> } };
    };
    const options = store.persist.getOptions();
    const partialized = options.partialize(useTrakl.getState());

    const expectedKeys = [
      'onboarded',
      'enabledTrackers',
      'pinnedTrackers',
      'profile',
      'habits',
      'tasks',
      'goals',
      'planner',
      'sleep',
      'workouts',
      'mood',
      'water',
      'weight',
      'meditation',
      'customTrackers',
      'notifications',
      'achievements',
      'monthlyBudget',
      'notificationsEnabled',
      'retentionNotificationsEnabled',
      'quietHoursEnabled',
      'quietHoursStart',
      'quietHoursEnd',
      'retentionNotifiedAchievementIds',
      'retentionLastInactivityNotificationAt',
      'waterGoal',
    ];

    for (const key of expectedKeys) {
      expect(partialized).toHaveProperty(key);
    }
  });

  it('partialize should exclude action functions', () => {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const store = useTrakl as unknown as {
      persist: { getOptions: () => { partialize: (s: unknown) => Record<string, unknown> } };
    };
    const options = store.persist.getOptions();
    const partialized = options.partialize(useTrakl.getState());

    expect(partialized).not.toHaveProperty('addTransaction');
    expect(partialized).not.toHaveProperty('addHabit');
    expect(partialized).not.toHaveProperty('addTask');
    expect(partialized).not.toHaveProperty('toggleTask');
    expect(partialized).not.toHaveProperty('exportAppData');
    expect(partialized).not.toHaveProperty('importAppData');
  });

  it('partialize should exclude hydrated and rehydrateFailed flags', () => {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const store = useTrakl as unknown as {
      persist: { getOptions: () => { partialize: (s: unknown) => Record<string, unknown> } };
    };
    const options = store.persist.getOptions();
    const partialized = options.partialize(useTrakl.getState());

    expect(partialized).not.toHaveProperty('hydrated');
    expect(partialized).not.toHaveProperty('rehydrateFailed');
  });
});

describe('Persistence: store version', () => {
  it('should have a numeric version for migrations', () => {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const store = useTrakl as unknown as {
      persist: { getOptions: () => { version: number } };
    };
    const options = store.persist.getOptions();
    expect(typeof options.version).toBe('number');
    expect(options.version).toBeGreaterThan(0);
  });
});
