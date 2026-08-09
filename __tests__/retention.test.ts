import { describe, expect, it } from '@jest/globals';

import {
  isWithinQuietHours,
  selectRetentionCandidates,
} from '@/src/infrastructure/services/retention';
import type { Habit } from '@/src/domain/types';

const habit = (completions: Record<string, boolean>): Habit => ({
  id: 'habit-1', name: 'Read', cadence: 'Daily', color: '#000', completions,
});

describe('retention notification selection', () => {
  it('handles overnight quiet-hours boundaries inclusively', () => {
    expect(isWithinQuietHours(new Date(2025, 0, 1, 22, 0), true, '22:00', '08:00')).toBe(true);
    expect(isWithinQuietHours(new Date(2025, 0, 1, 8, 1), true, '22:00', '08:00')).toBe(false);
    expect(isWithinQuietHours(new Date(2025, 0, 1, 12, 0), false, '22:00', '08:00')).toBe(false);
  });

  it('caps retention to one candidate per local day and uses stable ids', () => {
    const now = new Date(2025, 0, 8, 10, 0);
    const result = selectRetentionCandidates({
      habits: [habit({ '2025-01-07': true })],
      tasks: [], customTrackers: [],
      achievements: [{ id: 'a1', name: 'First', unlocked: true }],
      notifiedAchievementIds: [], now,
    });
    expect(result.filter((candidate) => candidate.date === '2025-01-08')).toHaveLength(1);
    expect(result[0].stableId).toContain('retention:');
  });

  it('selects inactivity only after four days and weekly review only with activity', () => {
    const now = new Date(2025, 0, 10, 10, 0);
    const inactive = selectRetentionCandidates({
      habits: [], tasks: [], customTrackers: [], achievements: [], notifiedAchievementIds: [],
      lastActivityAt: '2025-01-05T10:00:00.000Z', now,
    });
    expect(inactive.some((candidate) => candidate.kind === 'inactivity')).toBe(true);
    expect(inactive.some((candidate) => candidate.kind === 'weekly-review')).toBe(false);
  });
});
