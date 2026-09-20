import type { Href } from 'expo-router';

/**
 * Central typed route map. Prefer these constants over raw string literals so
 * refactors of the file tree are caught by TypeScript via Expo typed routes.
 */
export const ROUTES = {
  home: '/' as Href,
  trackers: '/trackers' as Href,
  analytics: '/analytics' as Href,
  profile: '/profile' as Href,
  onboarding: '/onboarding' as Href,
  search: '/search' as Href,
  quickAdd: '/quick-add' as Href,
  achievements: '/achievements' as Href,
  notifications: '/notifications' as Href,
  weeklyReview: '/weekly-review' as Href,
  finance: '/tracker/finance' as Href,
  habits: '/tracker/habits' as Href,
  tasks: '/tracker/tasks' as Href,
  goals: '/tracker/goals' as Href,
  planner: '/tracker/planner' as Href,
  sleep: '/tracker/sleep' as Href,
  fitness: '/tracker/fitness' as Href,
  mood: '/tracker/mood' as Href,
  water: '/tracker/water' as Href,
  weight: '/tracker/weight' as Href,
  meditation: '/tracker/meditation' as Href,
  custom: '/tracker/custom' as Href,
  customDetail: (id: string) => `/tracker/custom/${id}` as Href,
  financeAddExpense: '/tracker/finance?add=expense' as Href,
  financeAddIncome: '/tracker/finance?add=income' as Href,
  habitsAdd: '/tracker/habits?add=1' as Href,
  tasksAdd: '/tracker/tasks?add=1' as Href,
  goalsAdd: '/tracker/goals?add=1' as Href,
  plannerAdd: '/tracker/planner?add=1' as Href,
  sleepAdd: '/tracker/sleep?add=1' as Href,
  fitnessAdd: '/tracker/fitness?add=1' as Href,
  moodAdd: '/tracker/mood?add=1' as Href,
  waterAdd: '/tracker/water?add=1' as Href,
  weightAdd: '/tracker/weight?add=1' as Href,
  meditationAdd: '/tracker/meditation?add=1' as Href,
} as const;

export type AppRouteKey = keyof typeof ROUTES;
