import { describe, it, expect } from '@jest/globals';
import {
  dayISO,
  localDateKey,
  calendarDay,
  migrateHabitCompletionKey,
  migrateHabitCompletions,
} from '@/src/application/stats/dates';

describe('local calendar date keys', () => {
  it('dayISO matches localDateKey of local midnight', () => {
    expect(dayISO(0)).toBe(localDateKey(calendarDay(0)));
    expect(dayISO(0)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('dayISO does not use UTC-shifted toISOString date', () => {
    const localMidnight = calendarDay(0);
    const utcShifted = localMidnight.toISOString().slice(0, 10);
    // In UTC+ zones these differ; in UTC they match. Assertion: dayISO equals local.
    expect(dayISO(0)).toBe(localDateKey(localMidnight));
    if (utcShifted !== localDateKey(localMidnight)) {
      expect(dayISO(0)).not.toBe(utcShifted);
    }
  });

  it('migrates buggy UTC-prefix completion keys to local yyyy-MM-dd', () => {
    const localMidnight = calendarDay(0);
    const buggy = localMidnight.toISOString().slice(0, 10);
    const correct = localDateKey(localMidnight);
    expect(migrateHabitCompletionKey(buggy)).toBe(correct);
  });

  it('migrates full ISO completion keys via localDateKey', () => {
    const iso = calendarDay(0).toISOString();
    expect(migrateHabitCompletionKey(iso)).toBe(localDateKey(iso));
  });

  it('merges duplicate keys after migration', () => {
    const localMidnight = calendarDay(0);
    const buggy = localMidnight.toISOString().slice(0, 10);
    const correct = localDateKey(localMidnight);
    if (buggy === correct) {
      // UTC: no date shift, migration is identity
      expect(migrateHabitCompletions({ [correct]: true })[correct]).toBe(true);
      return;
    }
    const merged = migrateHabitCompletions({ [buggy]: true, [correct]: false });
    expect(merged[correct]).toBe(true);
  });
});
