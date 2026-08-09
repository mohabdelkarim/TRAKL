import type { Habit } from '@/src/domain/types';
import { localDateKey, calendarDay, dayISO } from './dates';

export function hasHabitCompletionOnDate(habit: Habit, date: Date | string): boolean {
  const dayKey = localDateKey(date);
  return Object.entries(habit.completions).some(
    ([key, completed]) => completed && localDateKey(key) === dayKey,
  );
}

function hasHabitCompletion(habit: Habit, offset: number): boolean {
  return hasHabitCompletionOnDate(habit, calendarDay(offset));
}

/** number of habits completed today / total */
export function habitsToday(habits: Habit[]): { done: number; total: number } {
  return {
    done: habits.filter((h) => hasHabitCompletion(h, 0)).length,
    total: habits.length,
  };
}

/**
 * Best single-habit current streak across all habits.
 * Optimized: pre-compute completion set once per habit instead of
 * calling Object.entries() on every iteration.
 */
export function bestStreak(habits: Habit[]): number {
  let best = 0;
  for (const h of habits) {
    const completedDays = new Set(
      Object.entries(h.completions)
        .filter(([, done]) => done)
        .map(([key]) => localDateKey(key)),
    );
    let streak = 0;
    for (let i = 0; i < 60; i++) {
      const dayKey = localDateKey(calendarDay(-i));
      if (completedDays.has(dayKey)) streak++;
      else if (i === 0) continue;
      else break;
    }
    best = Math.max(best, streak);
  }
  return best;
}

/** Completions for one habit in the last 7 days. */
export function weekCount(habit: Habit): number {
  let c = 0;
  for (let i = 0; i < 7; i++) {
    if (hasHabitCompletionOnDate(habit, calendarDay(-i))) c++;
  }
  return c;
}

/**
 * Fraction (0-1) of all habits completed on the given day-offset (0 = today,
 * -1 = yesterday, ...). Returns 0 when there are no habits.
 */
export function habitDayLevel(habits: Habit[], offset: number): number {
  if (habits.length === 0) return 0;
  const done = habits.filter((h) => hasHabitCompletion(h, offset)).length;
  return done / habits.length;
}

/** Number of habit completions across all habits on a given day-offset. */
export function habitDayCount(habits: Habit[], offset: number): number {
  return habits.reduce((c, h) => c + (hasHabitCompletion(h, offset) ? 1 : 0), 0);
}

/** Sum of completions across all habits over the last `days` days. */
export function habitTotalCompletions(habits: Habit[], days = 30): number {
  let total = 0;
  for (let i = 0; i < days; i++) total += habitDayCount(habits, -i);
  return total;
}

/** 7-day habit-completion-count series (oldest -> newest). */
export function habitSeries(habits: Habit[]): number[] {
  const out: number[] = [];
  for (let i = 6; i >= 0; i--) out.push(habitDayCount(habits, -i));
  return out;
}

/** Default weekly completion target per habit. */
export const WEEKLY_TARGET = 7;

/**
 * Current consecutive-day streak for a single habit.
 * Optimized: pre-compute completion set once.
 */
export function habitStreak(habit: Habit): number {
  const completedDays = new Set(
    Object.entries(habit.completions)
      .filter(([, done]) => done)
      .map(([key]) => localDateKey(key)),
  );
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const dayKey = localDateKey(calendarDay(-i));
    if (completedDays.has(dayKey)) streak++;
    else if (i === 0) continue;
    else break;
  }
  return streak;
}
