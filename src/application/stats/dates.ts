import { dayISO } from '../seed';

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

/** Seven local calendar days, oldest first, ending today. */
export function lastSevenCalendarDays(): { date: Date; key: string }[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = calendarDay(index - 6);
    return { date, key: localDateKey(date) };
  });
}

/** Check if an ISO timestamp falls within a given day-offset from today. */
export function inDay(iso: string, offset: number): boolean {
  const start = +new Date(dayISO(offset));
  const end = +new Date(dayISO(offset + 1));
  const time = +new Date(iso);
  return time >= start && time < end;
}

export { dayISO };
