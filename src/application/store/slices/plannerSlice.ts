import type { StateCreator } from 'zustand';

import type { TraklState, PlannerSlice } from '../types';
import { generateId } from '@/src/shared/utils/id';

export const createPlannerSlice: StateCreator<TraklState, [], [], PlannerSlice> = (set) => ({
  planner: [],

  addPlannerEvent: (e) => set((s) => ({ planner: [...s.planner, { ...e, id: generateId() }] })),

  deletePlannerEvent: (pid) =>
    set((s) => ({ planner: s.planner.filter((e) => e.id !== pid) })),
});
