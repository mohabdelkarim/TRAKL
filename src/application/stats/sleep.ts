import type { SleepEntry } from '@/src/domain/types';
import { dayISO } from './dates';

export function lastSleepHours(sleep: SleepEntry[]): number {
  if (sleep.length === 0) return 0;
  const sorted = [...sleep].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  return Math.round((sorted[0].durationMinutes / 60) * 10) / 10;
}

export function avgSleepHours(sleep: SleepEntry[]): number {
  if (sleep.length === 0) return 0;
  const avg = sleep.reduce((s, e) => s + e.durationMinutes, 0) / sleep.length / 60;
  return Math.round(avg * 10) / 10;
}

export function fmtSleep(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

/** Count of sleep entries recorded within the last `days` days. */
export function sleepNightsInWindow(sleep: SleepEntry[], days: number): number {
  const cutoff = +new Date(dayISO(-(days - 1)));
  return sleep.filter((e) => +new Date(e.date) >= cutoff).length;
}

/** Average sleep hours over a recent window (defaults to 7 days). */
export function avgSleepHoursWindow(sleep: SleepEntry[], days = 7): number {
  const cutoff = +new Date(dayISO(-(days - 1)));
  const recent = sleep.filter((e) => +new Date(e.date) >= cutoff);
  if (recent.length === 0) return 0;
  const avg = recent.reduce((s, e) => s + e.durationMinutes, 0) / recent.length / 60;
  return Math.round(avg * 10) / 10;
}

/**
 * Average sleep hours for the *previous* calendar window of `days` days
 * (i.e. the window ending the day before the current one starts). Uses the
 * same calendar-day boundaries as {@link avgSleepHoursWindow} so the two are
 * directly comparable.
 */
export function avgSleepHoursPrevWindow(sleep: SleepEntry[], days = 7): number {
  const start = +new Date(dayISO(-(days * 2 - 1)));
  const end = +new Date(dayISO(-(days - 1)));
  const recent = sleep.filter((e) => {
    const t = +new Date(e.date);
    return t >= start && t < end;
  });
  if (recent.length === 0) return 0;
  const avg = recent.reduce((s, e) => s + e.durationMinutes, 0) / recent.length / 60;
  return Math.round(avg * 10) / 10;
}

/** 7-day sleep-hours series (oldest -> newest), 0 on nights with no entry. */
export function sleepSeries(sleep: SleepEntry[]): number[] {
  const out: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = +new Date(dayISO(-i));
    const dayEnd = +new Date(dayISO(-i + 1));
    const entry = sleep.find((e) => {
      const time = +new Date(e.date);
      return time >= dayStart && time < dayEnd;
    });
    out.push(entry ? Math.round((entry.durationMinutes / 60) * 10) / 10 : 0);
  }
  return out;
}
