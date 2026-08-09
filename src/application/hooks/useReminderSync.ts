import { AppState } from 'react-native';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import {
  configureNotificationHandler,
  hasNotificationPermission,
  requestNotificationPermissionOnce,
  subscribeToNotificationEvents,
  syncDeliveredNotifications,
  syncReminders,
} from '@/src/infrastructure/services/notifications';
import { useTrakl } from '@/src/application/store';
import { computeAchievements } from '@/src/application/achievements';

/**
 * Keeps on-device local notifications in sync with the store.
 *
 * Re-schedules reminders whenever the reminder-bearing data changes
 * (habits, tasks, custom trackers) or the user toggles notifications.
 * Runs only after the persisted store has hydrated, so we never schedule
 * against stale seed data on cold start.
 */
export function useReminderSync(): void {
  const { i18n } = useTranslation();
  const addNotification = useTrakl((s) => s.addNotification);
  const setNotificationsEnabled = useTrakl((s) => s.setNotificationsEnabled);
  const hydrated = useTrakl((s) => s.hydrated);
  const enabled = useTrakl((s) => s.notificationsEnabled);
  const habits = useTrakl((s) => s.habits);
  const tasks = useTrakl((s) => s.tasks);
  const customTrackers = useTrakl((s) => s.customTrackers);
  const transactions = useTrakl((s) => s.transactions);
  const goals = useTrakl((s) => s.goals);
  const sleep = useTrakl((s) => s.sleep);
  const workouts = useTrakl((s) => s.workouts);
  const mood = useTrakl((s) => s.mood);
  const water = useTrakl((s) => s.water);
  const weight = useTrakl((s) => s.weight);
  const meditation = useTrakl((s) => s.meditation);
  const achievements = computeAchievements({
    transactions,
    habits,
    tasks,
    goals,
    sleep,
    workouts,
    mood,
    water,
    weight,
    meditation,
    customTrackers,
  });
  const retentionNotifiedAchievementIds = useTrakl((s) => s.retentionNotifiedAchievementIds);
  const retentionNotificationsEnabled = useTrakl((s) => s.retentionNotificationsEnabled);
  const quietHoursEnabled = useTrakl((s) => s.quietHoursEnabled);
  const quietHoursStart = useTrakl((s) => s.quietHoursStart);
  const quietHoursEnd = useTrakl((s) => s.quietHoursEnd);
  const markRetentionAchievementsNotified = useTrakl((s) => s.markRetentionAchievementsNotified);
  const retentionLastInactivityNotificationAt = useTrakl((s) => s.retentionLastInactivityNotificationAt);
  const markRetentionInactivityScheduled = useTrakl((s) => s.markRetentionInactivityScheduled);

  // Configure the foreground presentation handler and mirror delivered
  // notifications into the app's persisted in-app notification history.
  useEffect(() => {
    configureNotificationHandler();
    void syncDeliveredNotifications(addNotification);
    return subscribeToNotificationEvents(addNotification);
  }, [addNotification]);

  // Request permission once on the first suitable native app opening.
  useEffect(() => {
    if (!hydrated) return;
    void requestNotificationPermissionOnce().then((granted) => {
      setNotificationsEnabled(granted);
    });
  }, [hydrated, setNotificationsEnabled]);

  // Keep the in-app switch synchronized with the OS permission. This runs
  // on launch and whenever the app returns from Android/iOS settings.
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const granted = await hasNotificationPermission();
      if (active && useTrakl.getState().notificationsEnabled !== granted) {
        setNotificationsEnabled(granted);
      }
    };
    void refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, [setNotificationsEnabled]);

  // Serialize schedule runs. A naive boolean guard that *drops* a run while
  // another is in flight causes two problems: (1) the latest state can be lost,
  // and (2) two runs starting near-simultaneously each do cancel-then-reschedule
  // and can race into scheduling duplicate notifications. Instead we chain every
  // request onto a single promise so runs execute strictly one after another,
  // and always run the most recent snapshot last.
  const chain = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!hydrated) return;
    const snapshot = {
      habits,
      tasks,
      customTrackers,
      achievements,
      retentionNotifiedAchievementIds,
      retentionLastInactivityNotificationAt,
      retentionNotificationsEnabled,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
      onRetentionAchievementsScheduled: markRetentionAchievementsNotified,
      onRetentionInactivityScheduled: markRetentionInactivityScheduled,
    };
    chain.current = chain.current
      .catch(() => undefined)
      .then(() => syncReminders(snapshot, enabled))
      .then(() => undefined);
  }, [
    hydrated,
    enabled,
    habits,
    tasks,
    customTrackers,
    achievements,
    transactions,
    goals,
    sleep,
    workouts,
    mood,
    water,
    weight,
    meditation,
    retentionNotifiedAchievementIds,
    retentionLastInactivityNotificationAt,
    retentionNotificationsEnabled,
    quietHoursEnabled,
    quietHoursStart,
    quietHoursEnd,
    markRetentionAchievementsNotified,
    markRetentionInactivityScheduled,
    i18n.language,
  ]);
}
