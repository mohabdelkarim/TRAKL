import { describe, it, expect } from '@jest/globals';
import type { TFunction } from 'i18next';

import {
  formatHabitCadence,
  formatTaskProject,
  isDailyCadence,
} from '@/src/shared/utils/i18nStoredLabels';

const t = ((key: string) => {
  if (key === 'habits.daily') return 'Καθημερινά';
  if (key === 'sample.projectWork') return 'Δουλειά';
  if (key === 'sample.projectPersonal') return 'Προσωπικά';
  if (key === 'sample.projectHome') return 'Σπίτι';
  return key;
}) as TFunction;

describe('i18nStoredLabels', () => {
  it('treats Daily and legacy translated cadences as daily', () => {
    expect(isDailyCadence('Daily')).toBe(true);
    expect(isDailyCadence('Καθημερινά')).toBe(true);
    expect(isDailyCadence('Quotidien')).toBe(true);
    expect(isDailyCadence('Weekly')).toBe(false);
    expect(formatHabitCadence('Daily', t)).toBe('Καθημερινά');
    expect(formatHabitCadence('Καθημερινά', t)).toBe('Καθημερινά');
  });

  it('translates canonical and legacy task project keys', () => {
    expect(formatTaskProject('Work', t)).toBe('Δουλειά');
    expect(formatTaskProject('Δουλειά', t)).toBe('Δουλειά');
    expect(formatTaskProject('My custom', t)).toBe('My custom');
  });
});
