import type { Task } from '@/src/domain/types';
import { dayISO } from './dates';

export function tasksDueToday(tasks: Task[]): number {
  const today = new Date();
  return tasks.filter((t) => {
    if (t.done) return false;
    const d = new Date(t.due);
    return d.toDateString() === today.toDateString();
  }).length;
}

/**
 * Tasks completed within the last `days` days. Prefers the real completion
 * timestamp (`completedAt`); falls back to the `due` date for tasks marked
 * done before completion tracking existed.
 */
export function tasksDoneInWindow(tasks: Task[], days: number): number {
  const cutoff = +new Date(dayISO(-(days - 1)));
  return tasks.filter((t) => {
    if (!t.done) return false;
    const when = +new Date(t.completedAt ?? t.due);
    return when >= cutoff;
  }).length;
}

export type TaskGroupKey = 'overdue' | 'today' | 'tomorrow' | 'later' | 'noDate' | 'done';
export type TaskSort = 'due' | 'priority';

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

/** Which group a single task belongs to, based on its done flag + due date. */
export function taskGroupOf(task: Task): TaskGroupKey {
  if (task.done) return 'done';
  if (!task.due) return 'noDate';
  const d = new Date(task.due);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = +today;
  const dayMs = 86_400_000;
  const dDay = new Date(d);
  dDay.setHours(0, 0, 0, 0);
  const diff = Math.round((+dDay - start) / dayMs);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  return 'later';
}

/** Sort comparator for tasks by the chosen mode. */
function compareTasks(a: Task, b: Task, sort: TaskSort): number {
  if (sort === 'priority') {
    const pr = (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1);
    if (pr !== 0) return pr;
  }
  return +new Date(a.due) - +new Date(b.due);
}

export interface TaskGroup {
  key: TaskGroupKey;
  items: Task[];
}

const GROUP_ORDER: TaskGroupKey[] = ['overdue', 'today', 'tomorrow', 'later', 'noDate', 'done'];

/** Group tasks by due bucket and sort within each group. Empty groups omitted. */
export function groupTasks(tasks: Task[], sort: TaskSort): TaskGroup[] {
  const buckets = new Map<TaskGroupKey, Task[]>();
  for (const task of tasks) {
    const key = taskGroupOf(task);
    const list = buckets.get(key) ?? [];
    list.push(task);
    buckets.set(key, list);
  }
  return GROUP_ORDER.flatMap((key) => {
    const items = buckets.get(key);
    if (!items || items.length === 0) return [];
    return [{ key, items: [...items].sort((a, b) => compareTasks(a, b, sort)) }];
  });
}

/** 7-day task-completion-count series (oldest -> newest). */
export function taskSeries(tasks: Task[]): number[] {
  const out: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = +new Date(dayISO(-i));
    const dayEnd = +new Date(dayISO(-i + 1));
    out.push(
      tasks.filter((t) => {
        if (!t.done) return false;
        const time = +new Date(t.completedAt ?? t.due);
        return time >= dayStart && time < dayEnd;
      }).length,
    );
  }
  return out;
}
