import type { StateCreator } from 'zustand';

import type { TraklState, HealthSlice } from '../types';
import { generateId } from '@/src/shared/utils/id';
import { dayISO } from '@/src/application/seed';
import { WATER_GOAL } from '../types';

export const createHealthSlice: StateCreator<TraklState, [], [], HealthSlice> = (set) => ({
  sleep: [],
  workouts: [],
  mood: [],
  water: [],
  weight: [],
  meditation: [],

  addSleep: (entry) => set((s) => ({ sleep: [{ ...entry, id: generateId() }, ...s.sleep] })),

  addWorkout: (w) => set((s) => ({ workouts: [{ ...w, id: generateId() }, ...s.workouts] })),

  deleteWorkout: (wid) => set((s) => ({ workouts: s.workouts.filter((w) => w.id !== wid) })),

  addMood: (entry) => set((s) => ({ mood: [{ ...entry, id: generateId() }, ...s.mood] })),

  deleteMood: (mid) => set((s) => ({ mood: s.mood.filter((m) => m.id !== mid) })),

  addWater: (glasses) =>
    set((s) => ({
      water: [
        { id: generateId(), glasses: Math.max(1, Math.round(glasses)), date: new Date().toISOString() },
        ...s.water,
      ],
    })),

  resetWaterToday: () =>
    set((s) => {
      const start = +new Date(dayISO(0));
      const end = +new Date(dayISO(1));
      return {
        water: s.water.filter((w) => {
          const time = +new Date(w.date);
          return time < start || time >= end;
        }),
      };
    }),

  setWaterGoal: (goal) => set({ waterGoal: Math.min(30, Math.max(1, Math.round(goal))) }),

  addWeight: (kg) =>
    set((s) => ({
      weight: [
        {
          id: generateId(),
          kg: Math.min(500, Math.max(0.1, Math.round(kg * 10) / 10)),
          date: new Date().toISOString(),
        },
        ...s.weight,
      ],
    })),

  deleteWeight: (wid) => set((s) => ({ weight: s.weight.filter((w) => w.id !== wid) })),

  addMeditation: (entry) =>
    set((s) => ({ meditation: [{ ...entry, id: generateId() }, ...s.meditation] })),

  deleteMeditation: (mid) =>
    set((s) => ({ meditation: s.meditation.filter((m) => m.id !== mid) })),
});
