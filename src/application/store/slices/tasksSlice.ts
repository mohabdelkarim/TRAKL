import type { StateCreator } from 'zustand';

import type { TraklState, TasksSlice } from '../types';
import { generateId } from '@/src/shared/utils/id';

export const createTasksSlice: StateCreator<TraklState, [], [], TasksSlice> = (set) => ({
  tasks: [],

  toggleTask: (tid) =>
    set((s) => ({
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
    })),

  setTaskStatus: (tid, status) =>
    set((s) => ({
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
    })),

  addTask: (t) =>
    set((s) => ({
      tasks: [{ ...t, id: generateId(), done: false, status: 'todo' }, ...s.tasks],
    })),

  deleteTask: (tid) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== tid) })),
});
