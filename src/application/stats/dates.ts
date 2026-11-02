/** Return a local calendar date key for date-only and timestamp values. */
export function localDateKey(value: Date | string): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = typeof value === 'string' ? new Date(value) : value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** A local-midnight date at an offset from today. */
export function calendarDay(offset = 0): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}

/**
 * Local calendar date key (yyyy-MM-dd) at an offset from today.
 * Never uses toISOString for the date portion (UTC shift bug).
 */
export function dayISO(offset = 0): string {
  return localDateKey(calendarDay(offset));
}

/** Epoch ms of local midnight at an offset from today. */
export function dayStartMs(offset = 0): number {
  return +calendarDay(offset);
}

/** Seven local calendar days, oldest first, ending today. */
export function lastSevenCalendarDays(): { date: Date; key: string }[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = calendarDay(index - 6);
    return { date, key: localDateKey(date) };
  });
}

/** Check if an ISO timestamp falls within a given day-offset from today. */
export function inDay(iso: string, offset: number): boolean {
  const start = dayStartMs(offset);
  const end = dayStartMs(offset + 1);
  const time = +new Date(iso);
  return time >= start && time < end;
}

/**
 * Map a habit completion key produced by the old UTC-shifted dayISO()
 * onto the intended local yyyy-MM-dd. Idempotent for already-correct keys
 * only when called once via a versioned store migration.
 */
export function migrateHabitCompletionKey(key: string): string {
  if (key.includes('T') || key.length > 10) return localDateKey(key);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return key;

  for (let offset = -400; offset <= 2; offset++) {
    const day = calendarDay(offset);
    const buggy = day.toISOString().slice(0, 10);
    const correct = localDateKey(day);
    if (key === buggy) return correct;
  }
  return key;
}

export function migrateHabitCompletions(
  completions: Record<string, boolean>,
): Record<string, boolean> {
  const next: Record<string, boolean> = {};
  for (const [key, done] of Object.entries(completions)) {
    const migrated = migrateHabitCompletionKey(key);
    next[migrated] = next[migrated] || done;
  }
  return next;
}
