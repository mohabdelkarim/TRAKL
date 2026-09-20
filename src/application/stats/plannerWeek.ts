import { localDateKey } from './dates';

/** Monday (local) for the week containing `date`, as YYYY-MM-DD. */
export function mondayKeyOf(date: Date = new Date()): string {
  const dow = (date.getDay() + 6) % 7; // Mon=0 … Sun=6
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(date.getDate() - dow);
  return localDateKey(monday);
}

/** Monday key for a week relative to today (`0` = this week, `-1` = last, …). */
export function mondayKeyForOffset(offset: number, now: Date = new Date()): string {
  const dow = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - dow + offset * 7);
  return localDateKey(monday);
}
