import type { TrackerKey } from '@/src/domain/trackers';
import type {
  CustomTracker,
  Goal,
  Habit,
  MeditationSession,
  MoodEntry,
  PlannerEvent,
  SleepEntry,
  Task,
  Transaction,
  WaterEntry,
  WeightEntry,
  Workout,
} from '@/src/domain/types';
import { dayISO, localDateKey } from './dates';
import { budgetLeft } from './finance';
import { habitsToday, habitDayCount, habitSeries } from './habits';
import { tasksDueToday, taskSeries } from './tasks';
import { lastSleepHours, sleepNightsInWindow, sleepSeries } from './sleep';
import {
  avgMood,
  todayMood,
  moodSeries,
  waterToday,
  waterSeries,
  weightSeries,
  weightChange,
  meditationToday,
  meditationSeries,
  workoutSeries,
} from './health';

export interface InsightInput {
  transactions: Transaction[];
  habits: Habit[];
  tasks: Task[];
  goals: Goal[];
  planner: PlannerEvent[];
  sleep: SleepEntry[];
  workouts: Workout[];
  mood: MoodEntry[];
  water: WaterEntry[];
  weight: WeightEntry[];
  meditation: MeditationSession[];
  customTrackers: CustomTracker[];
  monthlyBudget: number;
}

/** What the card's accent visual should render. */
export type TrackerVisual = 'progress' | 'sparkline' | 'count';

export interface TrackerInsight {
  series: number[];
  visual: TrackerVisual;
  progress: number;
  trend: number | null;
  higherIsBetter: boolean;
  attention: boolean;
  lastUpdated: string | null;
}

/** Daily water goal (glasses) used for the water card progress ring. */
const WATER_GOAL_GLASSES = 8;

/** Build a 7-day expense series (oldest -> newest) bucketed by calendar day. */
function expenseSeries(transactions: Transaction[]): number[] {
  const out: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = +new Date(dayISO(-i));
    const dayEnd = +new Date(dayISO(-i + 1));
    const sum = transactions
      .filter((t) => t.kind === 'expense')
      .filter((t) => {
        const time = +new Date(t.date);
        return time >= dayStart && time < dayEnd;
      })
      .reduce((s, t) => s + t.amount, 0);
    out.push(sum);
  }
  return out;
}

/** Signed % change between the sum of the last 3 days vs the prior 4 days. */
function seriesTrend(series: number[]): number | null {
  if (series.length < 7) return null;
  const recent = series.slice(4).reduce((s, v) => s + v, 0);
  const prior = series.slice(0, 4).reduce((s, v) => s + v, 0);
  const recentAvg = recent / 3;
  const priorAvg = prior / 4;
  if (priorAvg === 0) return recentAvg === 0 ? null : 100;
  return Math.round(((recentAvg - priorAvg) / priorAvg) * 100);
}

/** Most recent activity timestamp across a tracker's records. */
function latestDate(dates: string[]): string | null {
  if (dates.length === 0) return null;
  return dates.reduce((a, b) => (+new Date(a) >= +new Date(b) ? a : b));
}

/**
 * Compute the rich card insight for a single tracker. Centralizes all the
 * per-tracker visual math (series, progress, trend, attention, recency) so the
 * Trackers hub card stays declarative.
 */
export function trackerInsight(key: TrackerKey, data: InsightInput): TrackerInsight {
  switch (key) {
    case 'finance': {
      const series = expenseSeries(data.transactions);
      const left = budgetLeft(data.transactions, data.monthlyBudget);
      const progress = data.monthlyBudget > 0 ? Math.round((left / data.monthlyBudget) * 100) : 0;
      return {
        series,
        visual: 'progress',
        progress,
        trend: seriesTrend(series),
        higherIsBetter: false,
        attention: left <= 0,
        lastUpdated: latestDate(data.transactions.map((t) => t.date)),
      };
    }
    case 'habits': {
      const series = habitSeries(data.habits);
      const today = habitsToday(data.habits);
      const progress = today.total ? Math.round((today.done / today.total) * 100) : 0;
      const lastDate = data.habits
        .flatMap((h) => Object.keys(h.completions).filter((d) => h.completions[d]))
        .reduce<string | null>((a, b) => (a && localDateKey(a) >= localDateKey(b) ? a : b), null);
      return {
        series,
        visual: 'progress',
        progress,
        trend: seriesTrend(series),
        higherIsBetter: true,
        attention: today.total > 0 && today.done < today.total,
        lastUpdated: lastDate,
      };
    }
    case 'tasks': {
      const series = taskSeries(data.tasks);
      const due = tasksDueToday(data.tasks);
      const total = data.tasks.length;
      const done = data.tasks.filter((t) => t.done).length;
      const progress = total ? Math.round((done / total) * 100) : 0;
      return {
        series,
        visual: 'progress',
        progress,
        trend: seriesTrend(series),
        higherIsBetter: true,
        attention: due > 0,
        lastUpdated: latestDate(data.tasks.flatMap((t) => (t.completedAt ? [t.completedAt] : []))),
      };
    }
    case 'goals': {
      const total = data.goals.length;
      const avg = total ? Math.round(data.goals.reduce((s, g) => s + g.progress, 0) / total) : 0;
      const series = data.goals.slice(0, 7).map((g) => g.progress);
      return {
        series,
        visual: 'progress',
        progress: avg,
        trend: null,
        higherIsBetter: true,
        attention: total > 0 && data.goals.some((g) => g.progress < 100),
        lastUpdated: latestDate(data.goals.map((g) => g.deadline)),
      };
    }
    case 'planner': {
      const thisWeek = data.planner.filter((e) => e.weekOffset === 0);
      const series = Array.from(
        { length: 7 },
        (_, i) => thisWeek.filter((e) => e.day === i).length,
      );
      const todayDow = (new Date().getDay() + 6) % 7;
      const todayEvents = thisWeek.filter((e) => e.day === todayDow).length;
      return {
        series,
        visual: 'count',
        progress: 0,
        trend: null,
        higherIsBetter: true,
        attention: todayEvents > 0,
        lastUpdated: null,
      };
    }
    case 'sleep': {
      const series = sleepSeries(data.sleep);
      const last = lastSleepHours(data.sleep);
      const progress = Math.min(100, Math.round((last / 8) * 100));
      return {
        series,
        visual: 'sparkline',
        progress,
        trend: seriesTrend(series),
        higherIsBetter: true,
        attention: sleepNightsInWindow(data.sleep, 1) === 0,
        lastUpdated: latestDate(data.sleep.map((e) => e.date)),
      };
    }
    case 'fitness': {
      const series = workoutSeries(data.workouts);
      return {
        series,
        visual: 'sparkline',
        progress: 0,
        trend: seriesTrend(series),
        higherIsBetter: true,
        attention: false,
        lastUpdated: latestDate(data.workouts.map((w) => w.date)),
      };
    }
    case 'mood': {
      const series = moodSeries(data.mood);
      const today = todayMood(data.mood);
      const avg = avgMood(data.mood);
      return {
        series,
        visual: 'sparkline',
        progress: Math.round((avg / 5) * 100),
        trend: seriesTrend(series),
        higherIsBetter: true,
        attention: today == null,
        lastUpdated: latestDate(data.mood.map((m) => m.date)),
      };
    }
    case 'water': {
      const series = waterSeries(data.water);
      const today = waterToday(data.water);
      const progress = Math.min(100, Math.round((today / WATER_GOAL_GLASSES) * 100));
      return {
        series,
        visual: 'progress',
        progress,
        trend: seriesTrend(series),
        higherIsBetter: true,
        attention: today < WATER_GOAL_GLASSES,
        lastUpdated: latestDate(data.water.map((w) => w.date)),
      };
    }
    case 'weight': {
      const series = weightSeries(data.weight);
      const change = weightChange(data.weight);
      return {
        series,
        visual: 'sparkline',
        progress: 0,
        trend: change == null ? null : Math.round(change * 10),
        higherIsBetter: false,
        attention: false,
        lastUpdated: latestDate(data.weight.map((w) => w.date)),
      };
    }
    case 'meditation': {
      const series = meditationSeries(data.meditation);
      const todayMin = meditationToday(data.meditation);
      const progress = Math.min(100, Math.round((todayMin / 10) * 100));
      return {
        series,
        visual: 'sparkline',
        progress,
        trend: seriesTrend(series),
        higherIsBetter: true,
        attention: todayMin === 0,
        lastUpdated: latestDate(data.meditation.map((m) => m.date)),
      };
    }
    case 'custom': {
      const allLogs = data.customTrackers.flatMap((c) => c.logs ?? []);
      const series: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const dayStart = +new Date(dayISO(-i));
        const dayEnd = +new Date(dayISO(-i + 1));
        series.push(
          allLogs.filter((l) => {
            const time = +new Date(l.date);
            return time >= dayStart && time < dayEnd;
          }).length,
        );
      }
      return {
        series,
        visual: 'count',
        progress: 0,
        trend: seriesTrend(series),
        higherIsBetter: true,
        attention: data.customTrackers.some((c) => c.reminder && (c.logs ?? []).length === 0),
        lastUpdated: latestDate(allLogs.map((l) => l.date)),
      };
    }
    default:
      return {
        series: [],
        visual: 'count',
        progress: 0,
        trend: null,
        higherIsBetter: true,
        attention: false,
        lastUpdated: null,
      };
  }
}

/** Relative "x ago" label key/value resolver — returns minutes since the date. */
export function minutesSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - +new Date(iso)) / 60000);
}
