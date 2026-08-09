import type { StateCreator } from 'zustand';

import type { TraklState, HabitsSlice } from '../types';
import { generateId } from '@/src/shared/utils/id';
import { dayISO } from '@/src/application/seed';

export const createHabitsSlice: StateCreator<TraklState, [], [], HabitsSlice> = (set) => ({
  habits: [],

  toggleHabitToday: (hid) =>
    set((s) => ({
      habits: s.habits.map((h) => {
        if (h.id !== hid) return h;
        const today = dayISO(0).slice(0, 10);
        const completions = { ...h.completions };
        const alreadyDone = Object.entries(completions).some(
          ([key, completed]) => completed && key.slice(0, 10) === today,
        );
        if (alreadyDone) {
          Object.keys(completions).forEach((key) => {
            if (key.slice(0, 10) === today) delete completions[key];
          });
        } else completions[today] = true;
        return { ...h, completions };
      }),
    })),

  addHabit: (name, color) =>
    set((s) => ({
      habits: [...s.habits, { id: generateId(), name, cadence: 'Daily', color, completions: {} }],
    })),

  updateHabit: (hid, patch) =>
    set((s) => ({
      habits: s.habits.map((h) => (h.id === hid ? { ...h, ...patch } : h)),
    })),

  deleteHabit: (hid) => set((s) => ({ habits: s.habits.filter((h) => h.id !== hid) })),
});
