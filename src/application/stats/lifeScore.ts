import type { TrackerKey } from '@/src/domain/trackers';
import type {
  Goal,
  Habit,
  SleepEntry,
  Task,
  Transaction,
} from '@/src/domain/types';
import { habitsToday } from './habits';
import { avgSleepHours } from './sleep';
import { budgetLeft } from './finance';

/**
 * Overall life score 0-100 blended from trackers.
 *
 * A tracker contributes to the score only when it is BOTH enabled by the user
 * AND actually has data (auto-detect): an enabled-but-empty tracker is skipped
 * instead of dragging the score down (e.g. empty sleep no longer scores 0) or
 * inflating it (e.g. zero tasks no longer scores a perfect 1). The base weights
 * (habits 25, tasks 20, sleep 20, goals 20, finance 15) are re-normalized across
 * the contributing subset so they always sum to 100%, no matter how many
 * trackers contribute. If no scored tracker contributes, returns 50 (neutral)
 * so the score never collapses to 0.
 *
 * Because callers read habits/tasks/sleep/goals/transactions directly from the
 * reactive store, the score auto-recalculates on every data change with no
 * manual refresh.
 */
export function lifeScore(args: {
  habits: Habit[];
  tasks: Task[];
  sleep: SleepEntry[];
  goals: Goal[];
  transactions: Transaction[];
  monthlyBudget: number;
  enabledTrackers?: TrackerKey[];
}): number | null {
  const { habits, tasks, sleep, goals, transactions, monthlyBudget, enabledTrackers } = args;

  const h = habitsToday(habits);
  const habitScore = h.total ? h.done / h.total : 0.5;

  const openTasks = tasks.filter((t) => !t.done).length;
  const totalTasks = tasks.length || 1;
  const taskScore = 1 - openTasks / (totalTasks + 2);

  const sleepScore = Math.min(1, avgSleepHours(sleep) / 8);

  const goalScore = goals.length
    ? goals.reduce((s, g) => s + g.progress, 0) / goals.length / 100
    : 0.5;

  const left = budgetLeft(transactions, monthlyBudget);
  const financeScore = monthlyBudget > 0 ? Math.min(1, left / monthlyBudget + 0.2) : 0.5;

  const parts: { key: TrackerKey; weight: number; score: number; hasData: boolean }[] = [
    { key: 'habits', weight: 0.25, score: habitScore, hasData: habits.length > 0 },
    { key: 'tasks', weight: 0.2, score: taskScore, hasData: tasks.length > 0 },
    { key: 'sleep', weight: 0.2, score: sleepScore, hasData: sleep.length > 0 },
    { key: 'goals', weight: 0.2, score: goalScore, hasData: goals.length > 0 },
    { key: 'finance', weight: 0.15, score: financeScore, hasData: transactions.length > 0 },
  ];

  const active = parts.filter(
    (p) => (enabledTrackers ? enabledTrackers.includes(p.key) : true) && p.hasData,
  );

  const totalWeight = active.reduce((s, p) => s + p.weight, 0);
  if (totalWeight === 0) return null;

  const blended = active.reduce((s, p) => s + p.score * (p.weight / totalWeight), 0);

  return Math.round(blended * 100);
}
