import { AppState } from 'react-native';
import { useEffect, useMemo, useRef } from 'react';
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
 * Runs only after the persisted store has hydrated.
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
  const retentionNotifiedAchievementIds = useTrakl((s) => s.retentionNotifiedAchievementIds);
  const retentionNotificationsEnabled = useTrakl((s) => s.retentionNotificationsEnabled);
  const quietHoursEnabled = useTrakl((s) => s.quietHoursEnabled);
  const quietHoursStart = useTrakl((s) => s.quietHoursStart);
  const quietHoursEnd = useTrakl((s) => s.quietHoursEnd);
  const markRetentionAchievementsNotified = useTrakl((s) => s.markRetentionAchievementsNotified);
  const retentionLastInactivityNotificationAt = useTrakl(
    (s) => s.retentionLastInactivityNotificationAt,
  );
  const markRetentionInactivityScheduled = useTrakl((s) => s.markRetentionInactivityScheduled);

  const achievements = useMemo(
    () =>
      computeAchievements({
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
      }),
    [
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
    ],
  );

  useEffect(() => {
    configureNotificationHandler();
    void syncDeliveredNotifications(addNotification);
    return subscribeToNotificationEvents(addNotification);
  }, [addNotification]);

  // Only force the preference OFF when the OS denies. Never force ON.
  useEffect(() => {
    if (!hydrated) return;
    void requestNotificationPermissionOnce().then((granted) => {
      if (!granted) setNotificationsEnabled(false);
    });
  }, [hydrated, setNotificationsEnabled]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const granted = await hasNotificationPermission();
      if (!active) return;
      if (!granted && useTrakl.getState().notificationsEnabled) {
        setNotificationsEnabled(false);
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
