import type { StateCreator } from 'zustand';

import type { TraklState, GoalsSlice } from '../types';
import { generateId } from '@/src/shared/utils/id';
import { progressFromMilestones } from '../types';

export const createGoalsSlice: StateCreator<TraklState, [], [], GoalsSlice> = (set) => ({
  goals: [],

  addGoal: (name, deadline) =>
    set((s) => ({
      goals: [...s.goals, { id: generateId(), name, deadline, progress: 0, milestones: [] }],
    })),

  addGoalFull: (g) =>
    set((s) => ({
      goals: [...s.goals, { ...g, id: generateId(), progress: progressFromMilestones(g.milestones) }],
    })),

  updateGoal: (gid, patch) =>
    set((s) => ({
      goals: s.goals.map((g) =>
        g.id === gid
          ? { ...g, ...patch, progress: progressFromMilestones(patch.milestones) }
          : g,
      ),
    })),

  toggleMilestone: (goalId, milestoneId) =>
    set((s) => ({
      goals: s.goals.map((g) => {
        if (g.id !== goalId) return g;
        const milestones = g.milestones.map((m) =>
          m.id === milestoneId ? { ...m, done: !m.done } : m,
        );
        return { ...g, milestones, progress: progressFromMilestones(milestones) };
      }),
    })),

  deleteGoal: (gid) => set((s) => ({ goals: s.goals.filter((g) => g.id !== gid) })),
});
