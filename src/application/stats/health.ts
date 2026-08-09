import type {
  MeditationSession,
  MoodEntry,
  WaterEntry,
  WeightEntry,
  Workout,
} from '@/src/domain/types';
import { dayISO, inDay } from './dates';

// Mood

/** Average mood (1-5) over the last `days`, or 0 when no entries. */
export function avgMood(mood: MoodEntry[], days = 7): number {
  const cutoff = +new Date(dayISO(-(days - 1)));
  const recent = mood.filter((m) => +new Date(m.date) >= cutoff);
  if (recent.length === 0) return 0;
  return Math.round((recent.reduce((s, m) => s + m.mood, 0) / recent.length) * 10) / 10;
}

/** Today's logged mood (most recent entry for today), or null. */
export function todayMood(mood: MoodEntry[]): MoodEntry | null {
  const today = mood
    .filter((m) => inDay(m.date, 0))
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  return today[0] ?? null;
}

/** 7-day mood series (oldest -> newest), 0 on days with no entry. */
export function moodSeries(mood: MoodEntry[]): number[] {
  const out: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = mood.filter((m) => inDay(m.date, -i));
    out.push(day.length ? day.reduce((s, m) => s + m.mood, 0) / day.length : 0);
  }
  return out;
}

// Water

/** Glasses of water logged today. */
export function waterToday(water: WaterEntry[]): number {
  return water.filter((w) => inDay(w.date, 0)).reduce((s, w) => s + w.glasses, 0);
}

/** 7-day water-glasses series (oldest -> newest). */
export function waterSeries(water: WaterEntry[]): number[] {
  const out: number[] = [];
  for (let i = 6; i >= 0; i--) {
    out.push(water.filter((w) => inDay(w.date, -i)).reduce((s, w) => s + w.glasses, 0));
  }
  return out;
}

// Weight

/** Latest recorded weight (kg), or null when no entries. */
export function latestWeight(weight: WeightEntry[]): number | null {
  if (weight.length === 0) return null;
  const sorted = [...weight].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  return sorted[0].kg;
}

/** Signed change between the latest weight and the oldest within `days`. */
export function weightChange(weight: WeightEntry[], days = 30): number | null {
  if (weight.length < 2) return null;
  const cutoff = +new Date(dayISO(-(days - 1)));
  const window = weight.filter((w) => +new Date(w.date) >= cutoff);
  const series = (window.length >= 2 ? window : weight).sort(
    (a, b) => +new Date(a.date) - +new Date(b.date),
  );
  const first = series[0].kg;
  const last = series[series.length - 1].kg;
  return Math.round((last - first) * 10) / 10;
}

/** 7-point weight series for sparkline (oldest -> newest), carries last value forward. */
export function weightSeries(weight: WeightEntry[]): number[] {
  if (weight.length === 0) return [0, 0];
  const sorted = [...weight].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  return sorted.slice(-7).map((w) => w.kg);
}

// Meditation

/** Meditation minutes logged today. */
export function meditationToday(sessions: MeditationSession[]): number {
  return sessions.filter((m) => inDay(m.date, 0)).reduce((s, m) => s + m.durationMinutes, 0);
}

/** Total meditation minutes over the last `days`. */
export function meditationMinutes(sessions: MeditationSession[], days = 7): number {
  const cutoff = +new Date(dayISO(-(days - 1)));
  return sessions
    .filter((m) => +new Date(m.date) >= cutoff)
    .reduce((s, m) => s + m.durationMinutes, 0);
}

/** Consecutive-day meditation streak ending today (or yesterday). */
export function meditationStreak(sessions: MeditationSession[]): number {
  const has = (offset: number) => sessions.some((m) => inDay(m.date, offset));
  let streak = 0;
  const start = has(0) ? 0 : -1;
  for (let i = start; i > -365; i--) {
    if (has(i)) streak++;
    else break;
  }
  return streak;
}

/** 7-day meditation-minutes series (oldest -> newest). */
export function meditationSeries(sessions: MeditationSession[]): number[] {
  const out: number[] = [];
  for (let i = 6; i >= 0; i--) {
    out.push(sessions.filter((m) => inDay(m.date, -i)).reduce((s, m) => s + m.durationMinutes, 0));
  }
  return out;
}

// Workouts

/** 7-day workout-count series (oldest -> newest). */
export function workoutSeries(workouts: Workout[]): number[] {
  const out: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = +new Date(dayISO(-i));
    const dayEnd = +new Date(dayISO(-i + 1));
    out.push(
      workouts.filter((w) => {
        const time = +new Date(w.date);
        return time >= dayStart && time < dayEnd;
      }).length,
    );
  }
  return out;
}
