import type { Achievement, CustomTracker, Habit, Task } from '@/src/domain/types';

export type RetentionKind = 'weekly-review' | 'streak-protection' | 'milestone' | 'inactivity';

export type RetentionCandidate = {
  kind: RetentionKind;
  stableId: string;
  date: string;
  hour: number;
  minute: number;
  achievementId?: string;
};

export type RetentionInput = {
  habits: Habit[];
  tasks: Task[];
  customTrackers: CustomTracker[];
  achievements: Array<Pick<Achievement, 'id' | 'unlocked'> & { name?: string }>;
  notifiedAchievementIds: string[];
  lastActivityAt?: string;
  lastInactivityNotificationAt?: string;
  now?: Date;
};

export function parseClock(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour <= 23 && minute <= 59 ? hour * 60 + minute : null;
}

/** Quiet hours include the start and end minute and support overnight ranges. */
export function isWithinQuietHours(
  date: Date,
  enabled: boolean,
  start: string,
  end: string,
): boolean {
  if (!enabled) return false;
  const startMinutes = parseClock(start);
  const endMinutes = parseClock(end);
  if (startMinutes === null || endMinutes === null || startMinutes === endMinutes) return false;
  const current = date.getHours() * 60 + date.getMinutes();
  return startMinutes > endMinutes
    ? current >= startMinutes || current <= endMinutes
    : current >= startMinutes && current <= endMinutes;
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function hasCompletionOn(habit: Habit, date: Date): boolean {
  const key = dayKey(date);
  return Object.entries(habit.completions ?? {}).some(([value, complete]) => complete && value.slice(0, 10) === key);
}

function activeStreak(habit: Habit, now: Date): boolean {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  if (hasCompletionOn(habit, today)) return false;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return hasCompletionOn(habit, yesterday);
}

function hasActivity(input: RetentionInput): boolean {
  return input.habits.some((h) => Object.values(h.completions ?? {}).some(Boolean))
    || input.tasks.some((t) => t.done || t.completedAt)
    || input.customTrackers.some((t) => (t.logs ?? []).length > 0);
}

function inferredLastActivity(input: RetentionInput): Date | null {
  const values = [
    ...input.habits.flatMap((h) => Object.keys(h.completions ?? {}).filter((key) => h.completions[key]).map((key) => new Date(key))),
    ...input.tasks.flatMap((t) => (t.completedAt ? [new Date(t.completedAt)] : [])),
    ...input.customTrackers.flatMap((t) => (t.logs ?? []).map((log) => new Date(log.date))),
  ].filter((date) => !Number.isNaN(date.getTime()));
  return values.sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
}

function nextSunday(now: Date): Date {
  const result = new Date(now);
  result.setHours(18, 0, 0, 0);
  const days = (7 - result.getDay()) % 7 || 7;
  result.setDate(result.getDate() + days);
  return result;
}

/** Selects at most one retention candidate for each local calendar day. */
export function selectRetentionCandidates(input: RetentionInput): RetentionCandidate[] {
  const now = input.now ?? new Date();
  const candidates: RetentionCandidate[] = [];
  const today = dayKey(now);
  const latestActivity = input.lastActivityAt ? new Date(input.lastActivityAt) : inferredLastActivity(input);
  const inactivityDays = latestActivity
    ? Math.floor((new Date(now).setHours(0, 0, 0, 0) - new Date(latestActivity).setHours(0, 0, 0, 0)) / 86400000)
    : hasActivity(input) ? 0 : 999;

  const streakHabit = input.habits.find((habit) => activeStreak(habit, now));
  if (streakHabit) {
    candidates.push({ kind: 'streak-protection', stableId: `retention:streak:${streakHabit.id}:${today}`, date: today, hour: 18, minute: 0 });
  }

  const newAchievement = input.achievements.find(
    (achievement) => achievement.unlocked && !input.notifiedAchievementIds.includes(achievement.id),
  );
  if (newAchievement) {
    candidates.push({ kind: 'milestone', stableId: `retention:milestone:${newAchievement.id}`, date: today, hour: 12, minute: 0, achievementId: newAchievement.id });
  }

  const lastInactivityNotification = input.lastInactivityNotificationAt
    ? new Date(input.lastInactivityNotificationAt)
    : null;
  const inactivityCooldownElapsed = !lastInactivityNotification
    || now.getTime() - lastInactivityNotification.getTime() >= 7 * 86400000;
  if (inactivityDays >= 4 && latestActivity && inactivityCooldownElapsed) {
    const date = new Date(now);
    date.setDate(date.getDate() + 1);
    candidates.push({ kind: 'inactivity', stableId: `retention:inactivity:${dayKey(date)}`, date: dayKey(date), hour: 18, minute: 0 });
  }

  if (hasActivity(input)) {
    const date = nextSunday(now);
    candidates.push({ kind: 'weekly-review', stableId: `retention:weekly:${dayKey(date)}`, date: dayKey(date), hour: 18, minute: 0 });
  }

  const chosen = new Map<string, RetentionCandidate>();
  for (const candidate of candidates) {
    if (!chosen.has(candidate.date)) chosen.set(candidate.date, candidate);
  }
  return [...chosen.values()];
}
