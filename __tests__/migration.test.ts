import { describe, it, expect } from '@jest/globals';
import { migrate } from '@/src/application/store/migrations';
import { WATER_GOAL, RETENTION_DEFAULTS } from '@/src/application/store/types';

describe('Migration: structured versioned steps', () => {
  it('returns the original object for non-object input', () => {
    expect(migrate(null, 0)).toBeNull();
    expect(migrate('string', 0)).toBe('string');
    expect(migrate(42, 0)).toBe(42);
  });

  it('returns the original object on error', () => {
    const bad = { get prop() { throw new Error('boom'); } };
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const result = migrate(bad as unknown as Record<string, unknown>, 0);
    expect(result).toBe(bad);
  });

  it('backfills customTracker logs array', () => {
    const record = {
      customTrackers: [
        { id: 'c1', name: 'Tracker 1' },
        { id: 'c2', name: 'Tracker 2', logs: [{ id: 'l1', value: 5, date: '2024-01-01' }] },
      ],
    };
    const result = migrate(record, 0) as Record<string, unknown>;
    const trackers = result.customTrackers as Array<{ logs?: unknown[] }>;
    expect(Array.isArray(trackers[0].logs)).toBe(true);
    expect(trackers[0].logs).toHaveLength(0);
    expect(trackers[1].logs).toHaveLength(1);
  });

  it('backfills task completedAt for done tasks', () => {
    const record = {
      tasks: [
        { id: 't1', done: true, due: '2024-01-01' },
        { id: 't2', done: false, due: '2024-01-02' },
        { id: 't3', done: true, completedAt: '2024-01-03' },
      ],
    };
    const result = migrate(record, 0) as Record<string, unknown>;
    const tasks = result.tasks as Array<{ completedAt?: string; done: boolean }>;
    expect(tasks[0].completedAt).toBe('2024-01-01');
    expect(tasks[1].completedAt).toBeUndefined();
    expect(tasks[2].completedAt).toBe('2024-01-03');
  });

  it('backfills profile memberSince', () => {
    const record = { profile: { name: 'Alex' } };
    const result = migrate(record, 0) as Record<string, { memberSince: string }>;
    expect(result.profile.memberSince).toMatch(/^\d{4}-/);
  });

  it('backfills pinnedTrackers array', () => {
    const record = {};
    const result = migrate(record, 0) as Record<string, unknown>;
    expect(Array.isArray(result.pinnedTrackers)).toBe(true);
    expect(result.pinnedTrackers).toHaveLength(0);
  });

  it('backfills planner weekOffset', () => {
    const record = {
      planner: [
        { id: 'e1', title: 'Event' },
        { id: 'e2', title: 'Event 2', weekOffset: 1 },
      ],
    };
    const result = migrate(record, 0) as Record<string, unknown>;
    const planner = result.planner as Array<{ weekOffset: number }>;
    expect(planner[0].weekOffset).toBe(0);
    expect(planner[1].weekOffset).toBe(1);
  });

  it('backfills mood, water, weight, meditation arrays', () => {
    const record = {};
    const result = migrate(record, 0) as Record<string, unknown>;
    expect(Array.isArray(result.mood)).toBe(true);
    expect(Array.isArray(result.water)).toBe(true);
    expect(Array.isArray(result.weight)).toBe(true);
    expect(Array.isArray(result.meditation)).toBe(true);
  });

  it('backfills enabledTrackers with new trackers', () => {
    const record = { enabledTrackers: ['finance', 'habits'] };
    const result = migrate(record, 0) as Record<string, string[]>;
    expect(result.enabledTrackers).toContain('mood');
    expect(result.enabledTrackers).toContain('water');
    expect(result.enabledTrackers).toContain('weight');
    expect(result.enabledTrackers).toContain('meditation');
    expect(result.enabledTrackers).toContain('finance');
  });

  it('backfills waterGoal', () => {
    const record = {};
    const result = migrate(record, 0) as Record<string, unknown>;
    expect(result.waterGoal).toBe(WATER_GOAL);
  });

  it('backfills retention settings with defaults', () => {
    const record = {};
    const result = migrate(record, 0) as Record<string, unknown>;
    expect(result.retentionNotificationsEnabled).toBe(RETENTION_DEFAULTS.retentionNotificationsEnabled);
    expect(result.quietHoursEnabled).toBe(RETENTION_DEFAULTS.quietHoursEnabled);
    expect(result.quietHoursStart).toBe(RETENTION_DEFAULTS.quietHoursStart);
    expect(result.quietHoursEnd).toBe(RETENTION_DEFAULTS.quietHoursEnd);
  });

  it('backfills retentionNotifiedAchievementIds from unlocked achievements', () => {
    const record = {
      achievements: [
        { id: 'a1', unlocked: true },
        { id: 'a2', unlocked: false },
        { id: 'a3', unlocked: true },
      ],
    };
    const result = migrate(record, 0) as Record<string, string[]>;
    expect(result.retentionNotifiedAchievementIds).toEqual(['a1', 'a3']);
  });

  it('backfills retentionLastInactivityNotificationAt as undefined', () => {
    const record = {};
    const result = migrate(record, 0) as Record<string, unknown>;
    expect(result.retentionLastInactivityNotificationAt).toBeUndefined();
  });

  it('filters out notifications with empty title and message', () => {
    const record = {
      notifications: [
        { id: 'n1', title: 'Hello', message: 'World' },
        { id: 'n2', title: '', message: '' },
        { id: 'n3', title: '  ', message: '  ' },
        { id: 'n4', message: 'No title but has message' },
      ],
    };
    const result = migrate(record, 0) as Record<string, Array<{ title: string }>>;
    expect(result.notifications).toHaveLength(2);
    expect(result.notifications[0].title).toBe('Hello');
    expect(result.notifications[1].title).toBe('No title but has message');
  });

  it('resets stale budget of 1600 when no transactions exist', () => {
    const record = { monthlyBudget: 1600, transactions: [] };
    const result = migrate(record, 0) as Record<string, unknown>;
    expect(result.monthlyBudget).toBe(0);
  });

  it('keeps budget of 1600 when transactions exist', () => {
    const record = { monthlyBudget: 1600, transactions: [{ id: 't1' }] };
    const result = migrate(record, 0) as Record<string, unknown>;
    expect(result.monthlyBudget).toBe(1600);
  });

  it('backfills all tracker arrays as empty arrays', () => {
    const record = { habits: [{ id: 'h1' }] };
    const result = migrate(record, 0) as Record<string, unknown>;
    expect(result.habits).toHaveLength(1);
    expect(Array.isArray(result.transactions)).toBe(true);
    expect(Array.isArray(result.goals)).toBe(true);
    expect(Array.isArray(result.planner)).toBe(true);
    expect(Array.isArray(result.sleep)).toBe(true);
    expect(Array.isArray(result.workouts)).toBe(true);
  });

  it('is idempotent — running migrate twice produces the same result', () => {
    const record = { habits: [{ id: 'h1' }] };
    const once = migrate(record, 0);
    const twice = migrate(once, 0);
    expect(twice).toEqual(once);
  });
});
