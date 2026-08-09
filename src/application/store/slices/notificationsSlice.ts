import type { StateCreator } from 'zustand';

import type { TraklState, NotificationsSlice } from '../types';

export const createNotificationsSlice: StateCreator<TraklState, [], [], NotificationsSlice> = (
  set,
) => ({
  notifications: [],

  addNotification: (notification) =>
    set((s) => {
      if (!notification.title.trim() && !notification.message.trim()) return s;
      if (s.notifications.some((n) => n.id === notification.id)) return s;
      return {
        notifications: [{ ...notification, read: false }, ...s.notifications].slice(0, 100),
      };
    }),

  markAllNotificationsRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
});
