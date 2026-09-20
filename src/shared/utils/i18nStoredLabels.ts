/**
 * Helpers for values that must be *stored* as stable keys but *shown*
 * translated. Covers legacy rows that older builds persisted as localised
 * English/locale strings (e.g. sample cadence "Καθημερινά").
 */

import type { TFunction } from 'i18next';

/** Canonical habit cadence key written by addHabit / new sample data. */
export const HABIT_CADENCE_DAILY = 'Daily';

const DAILY_CADENCE_ALIASES = new Set(
  [
    'daily',
    'καθημερινά',
    'quotidien',
    'diario',
    'diário',
    'täglich',
    'giornaliero',
    'dagelijks',
    'codziennie',
    'ежедневно',
    'günlük',
    'harian',
    'hằng ngày',
    '매일',
    '毎日',
    '每天',
    'रोज़ाना',
    'প্রতিদিন',
    'يوميًا',
    'روزانہ',
  ].map((s) => s.toLowerCase()),
);

export function isDailyCadence(cadence: string): boolean {
  const trimmed = cadence.trim();
  if (trimmed === HABIT_CADENCE_DAILY) return true;
  return DAILY_CADENCE_ALIASES.has(trimmed.toLowerCase());
}

export function formatHabitCadence(cadence: string, t: TFunction): string {
  return isDailyCadence(cadence) ? t('habits.daily') : cadence;
}

/** Canonical task project keys used by sample data + empty-form fallback. */
export type TaskProjectKey = 'Work' | 'Personal' | 'Home';

const TASK_PROJECT_I18N = {
  Work: 'sample.projectWork',
  Personal: 'sample.projectPersonal',
  Home: 'sample.projectHome',
} as const;

const TASK_PROJECT_ALIASES: Record<string, TaskProjectKey> = {
  work: 'Work',
  personal: 'Personal',
  home: 'Home',
  // Locale spellings previously persisted by sample seed
  δουλειά: 'Work',
  arbeit: 'Work',
  trabajo: 'Work',
  travail: 'Work',
  lavoro: 'Work',
  trabalho: 'Work',
  werk: 'Work',
  praca: 'Work',
  работа: 'Work',
  iş: 'Work',
  pekerjaan: 'Work',
  'công việc': 'Work',
  업무: 'Work',
  工作: 'Work',
  仕事: 'Work',
  कार्य: 'Work',
  কাজ: 'Work',
  العمل: 'Work',
  کام: 'Work',
  προσωπικά: 'Personal',
  privat: 'Personal',
  personale: 'Personal',
  personnel: 'Personal',
  persoonlijk: 'Personal',
  pessoal: 'Personal',
  osobiste: 'Personal',
  личное: 'Personal',
  kişisel: 'Personal',
  pribadi: 'Personal',
  'cá nhân': 'Personal',
  개인: 'Personal',
  个人: 'Personal',
  個人: 'Personal',
  व्यक्तिगत: 'Personal',
  ব্যক্তিগত: 'Personal',
  شخصي: 'Personal',
  ذاتی: 'Personal',
  σπίτι: 'Home',
  casa: 'Home',
  maison: 'Home',
  zuhause: 'Home',
  thuis: 'Home',
  dom: 'Home',
  дом: 'Home',
  ev: 'Home',
  hogar: 'Home',
  rumah: 'Home',
  nhà: 'Home',
  집: 'Home',
  家: 'Home',
  家庭: 'Home',
  घर: 'Home',
  বাড়ি: 'Home',
  المنزل: 'Home',
  گھر: 'Home',
};

export function formatTaskProject(project: string, t: TFunction): string {
  const trimmed = project.trim();
  if (!trimmed) return trimmed;
  if (trimmed === 'Work' || trimmed === 'Personal' || trimmed === 'Home') {
    return t(TASK_PROJECT_I18N[trimmed]);
  }
  const mapped = TASK_PROJECT_ALIASES[trimmed.toLowerCase()];
  return mapped ? t(TASK_PROJECT_I18N[mapped]) : project;
}
