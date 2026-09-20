import type { StateCreator } from 'zustand';

import type { TraklState, TasksSlice } from '../types';
import { generateId } from '@/src/shared/utils/id';
import { maybeArmRatePrompt } from '@/src/shared/ratePrompt';

export const createTasksSlice: StateCreator<TraklState, [], [], TasksSlice> = (set) => ({
  tasks: [],

  toggleTask: (tid) =>
    set((s) => {
      const target = s.tasks.find((t) => t.id === tid);
      const completing = Boolean(target && !target.done);
      return {
        tasks: s.tasks.map((t) =>
          t.id === tid
            ? {
                ...t,
                done: !t.done,
                status: !t.done ? 'done' : 'todo',
                completedAt: !t.done ? new Date().toISOString() : undefined,
              }
            : t,
        ),
        ...(completing ? maybeArmRatePrompt(s) : {}),
      };
    }),

  setTaskStatus: (tid, status) =>
    set((s) => {
      const target = s.tasks.find((t) => t.id === tid);
      const completing = Boolean(target && status === 'done' && target.status !== 'done');
      return {
        tasks: s.tasks.map((t) =>
          t.id === tid
            ? {
                ...t,
                status,
                done: status === 'done',
                completedAt:
                  status === 'done' ? (t.completedAt ?? new Date().toISOString()) : undefined,
              }
            : t,
        ),
        ...(completing ? maybeArmRatePrompt(s) : {}),
      };
    }),

  addTask: (t) =>
    set((s) => ({
      tasks: [{ ...t, id: generateId(), done: false, status: 'todo' }, ...s.tasks],
    })),

  deleteTask: (tid) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== tid) })),
});
