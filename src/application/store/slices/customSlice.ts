import type { StateCreator } from 'zustand';

import type { TraklState, CustomSlice } from '../types';
import { generateId } from '@/src/shared/utils/id';

export const createCustomSlice: StateCreator<TraklState, [], [], CustomSlice> = (set) => ({
  customTrackers: [],

  addCustomTracker: (c) =>
    set((s) => ({ customTrackers: [...s.customTrackers, { ...c, id: generateId(), logs: [] }] })),

  updateCustomTracker: (cid, patch) =>
    set((s) => ({
      customTrackers: s.customTrackers.map((c) => (c.id === cid ? { ...c, ...patch } : c)),
    })),

  logCustomValue: (trackerId, value) =>
    set((s) => ({
      customTrackers: s.customTrackers.map((c) =>
        c.id === trackerId
          ? {
              ...c,
              logs: [
                {
                  id: generateId(),
                  value: Math.min(1_000_000, Math.max(-1_000_000, value || 0)),
                  date: new Date().toISOString(),
                },
                ...(c.logs ?? []),
              ],
            }
          : c,
      ),
    })),

  deleteCustomLog: (trackerId, logId) =>
    set((s) => ({
      customTrackers: s.customTrackers.map((c) =>
        c.id === trackerId ? { ...c, logs: (c.logs ?? []).filter((l) => l.id !== logId) } : c,
      ),
    })),

  deleteCustomTracker: (cid) =>
    set((s) => ({ customTrackers: s.customTrackers.filter((c) => c.id !== cid) })),
});
