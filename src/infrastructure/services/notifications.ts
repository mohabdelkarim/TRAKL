import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type * as NotificationsModule from 'expo-notifications';
import type { ParseKeys } from 'i18next';

import i18n from './i18n';
import type { Achievement, CustomTracker, Habit, Task } from '@/src/domain/types';
import type { TrackerKey } from '@/src/domain/trackers';
import { isWithinQuietHours, selectRetentionCandidates } from './retention';

function localDateFromKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Translate in the currently-active language (bound translator avoids
 *  English fallback due to load timing). */
function nt(key: string, options?: Record<string, unknown>): string {
  const lng = i18n.resolvedLanguage ?? i18n.language ?? 'en';
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- runtime i18n key is always a valid ParseKeys at call sites
  return i18n.getFixedT(lng)(key as ParseKeys, options);
}

/**
 * Real local notifications for TRAKL.
 *
 * Schedules on-device reminders (no server / push token needed):
 *  - Habits with a `reminderTime` -> daily reminder at that time.
 *  - Custom trackers with `reminder` + `reminderTime` -> daily reminder.
 *  - Tasks that are not done and due in the future -> one reminder at 09:00
 *    on the due date.
 *
 * Everything is gated behind the user's `notificationsEnabled` preference and
 * runtime permission. Web is a no-op (expo-notifications has no web scheduler).
 */

export const NOTIF_PREFIX = 'trakl';

// Local notification scheduling requires a real native module, which is absent
// in Expo Go (storeClient) on SDK 53+. Treat that like web: a no-op, so we
// don't trigger the "remote notifications removed from Expo Go" warning or
// crash on scheduling. Works fully in a dev build / TestFlight / published app.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const notifDisabled = Platform.OS === 'web' || isExpoGo;

const isWeb = notifDisabled;

// IMPORTANT: never statically import `expo-notifications`. On Expo Go (SDK 53+)
// merely loading the module logs the "remote notifications removed from Expo Go"
// warning. We require it lazily and ONLY when notifications are enabled, so the
// module is never evaluated on web or in Expo Go.
let cachedModule: typeof NotificationsModule | null = null;
function getNotifications(): typeof NotificationsModule | null {
  if (isWeb) return null;
  if (cachedModule) return cachedModule;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- lazy require for Expo Go guard; safe cast
  cachedModule = require('expo-notifications') as typeof NotificationsModule;
  return cachedModule;
}

let handlerConfigured = false;

/** Configure how notifications present while the app is foregrounded. */
export function configureNotificationHandler(): void {
  if (isWeb || handlerConfigured) return;
  const Notifications = getNotifications();
  if (!Notifications) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Ensure the Android default channel exists (required for Android display). */
async function ensureAndroidChannel(Notifications: typeof NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
  });
}

/**
 * Request notification permission. Returns true if granted.
 * Safe to call repeatedly; resolves immediately if already granted.
 */
let permissionRequestPromise: Promise<boolean> | null = null;

export async function requestNotificationPermission(): Promise<boolean> {
  if (isWeb) return false;
  if (permissionRequestPromise) return permissionRequestPromise;
  permissionRequestPromise = (async () => {
    const Notifications = getNotifications();
    if (!Notifications) return false;
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const next = await Notifications.requestPermissionsAsync();
    return next.granted;
  })().finally(() => {
    permissionRequestPromise = null;
  });
  return permissionRequestPromise;
}

const PERMISSION_REQUESTED_KEY = 'trakl-notification-permission-requested-v1';

/** Request permission once automatically on the first native app opening. */
export async function requestNotificationPermissionOnce(): Promise<boolean> {
  if (isWeb) return false;
  const granted = await hasNotificationPermission();
  if (granted) return true;
  try {
    const requested = await AsyncStorage.getItem(PERMISSION_REQUESTED_KEY);
    if (requested === '1') return false;
    await AsyncStorage.setItem(PERMISSION_REQUESTED_KEY, '1');
  } catch {
    // A storage failure must not block the OS permission prompt.
  }
  return requestNotificationPermission();
}

/** Read the OS permission without prompting the user. */
export async function hasNotificationPermission(): Promise<boolean> {
  if (isWeb) return false;
  const Notifications = getNotifications();
  if (!Notifications) return false;
  const permissions = await Notifications.getPermissionsAsync();
  return permissions.granted;
}

export type AppNotificationEvent = {
  id: string;
  tracker: TrackerKey;
  title: string;
  message: string;
  time: string;
};

function toAppNotificationEvent(
  notification: NotificationsModule.Notification,
): AppNotificationEvent {
  const data = notification.request.content.data as
    | { kind?: string; name?: string; stableId?: string }
    | undefined;
  const tracker: TrackerKey =
    data?.kind === 'habit' ? 'habits' : data?.kind === 'task' ? 'tasks' : 'custom';
  const content = notification.request.content;
  let fallbackTitle = 'custom.title';
  let fallbackBody = 'notifReminders.customBody';
  if (data?.kind === 'habit') {
    fallbackTitle = 'notifReminders.habitTitle';
    fallbackBody = 'notifReminders.habitBody';
  } else if (data?.kind === 'task') {
    fallbackTitle = 'notifReminders.taskTitle';
    fallbackBody = 'notifReminders.taskBody';
  } else if (data?.kind === 'retention') {
    const stableId = data.stableId ?? '';
    fallbackTitle = stableId.includes(':weekly:')
      ? 'notifReminders.weeklyReviewTitle'
      : stableId.includes(':streak:')
        ? 'notifReminders.streakTitle'
        : stableId.includes(':milestone:')
          ? 'notifReminders.milestoneTitle'
          : 'notifReminders.inactivityTitle';
    fallbackBody = stableId.includes(':weekly:')
      ? 'notifReminders.weeklyReviewBody'
      : stableId.includes(':streak:')
        ? 'notifReminders.streakBody'
        : stableId.includes(':milestone:')
          ? 'notifReminders.milestoneBody'
          : 'notifReminders.inactivityBody';
  }
  return {
    id: `native-${notification.request.identifier}`,
    tracker,
    title: content.title || data?.name || nt(fallbackTitle),
    message: content.body || nt(fallbackBody, { name: data?.name ?? '' }),
    time: new Date().toISOString(),
  };
}

/** Import notifications delivered while the app was backgrounded or closed. */
export async function syncDeliveredNotifications(
  onEvent: (event: AppNotificationEvent) => void,
): Promise<void> {
  if (isWeb) return;
  const Notifications = getNotifications();
  if (!Notifications) return;
  const delivered = await Notifications.getPresentedNotificationsAsync();
  for (const notification of delivered) onEvent(toAppNotificationEvent(notification));
  const response = await Notifications.getLastNotificationResponseAsync();
  if (response) onEvent(toAppNotificationEvent(response.notification));
}

/** Listen for delivered/tapped local notifications so the in-app history stays in sync. */
export function subscribeToNotificationEvents(
  onEvent: (event: AppNotificationEvent) => void,
): () => void {
  if (isWeb) return () => undefined;
  const Notifications = getNotifications();
  if (!Notifications) return () => undefined;
  const received = Notifications.addNotificationReceivedListener((notification) =>
    onEvent(toAppNotificationEvent(notification)),
  );
  const response = Notifications.addNotificationResponseReceivedListener((result) =>
    onEvent(toAppNotificationEvent(result.notification)),
  );
  return () => {
    received.remove();
    response.remove();
  };
}

/** Parse an "HH:mm" string into { hour, minute }; null if invalid. */
function parseTime(time: string | undefined): { hour: number; minute: number } | null {
  if (!time) return null;
  const [h, m] = time.split(':');
  const hour = Number(h);
  const minute = Number(m);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

export interface ReminderData {
  habits: Habit[];
  tasks: Task[];
  customTrackers: CustomTracker[];
  achievements: Array<Pick<Achievement, 'id' | 'unlocked'> & { name?: string }>;
  retentionNotifiedAchievementIds: string[];
  retentionLastInactivityNotificationAt?: string;
  retentionNotificationsEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  onRetentionAchievementsScheduled?: (ids: string[]) => void;
  onRetentionInactivityScheduled?: (at: string) => void;
}

/** Cancel every reminder this app has scheduled. */
export async function cancelAllReminders(): Promise<void> {
  if (isWeb) return;
  const Notifications = getNotifications();
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Rebuild all scheduled reminders from current data.
 *
 * Strategy: cancel everything, then re-schedule. This keeps the scheduled set
 * perfectly in sync with the store without tracking individual ids.
 *
 * Runs are serialized through `syncLock` so a cancel-then-schedule cycle is
 * atomic: two overlapping callers can never both reach the scheduling step and
 * produce duplicate notifications.
 */
/** Result of a sync run, so callers can react to permission denial. */
export type SyncResult = 'ok' | 'disabled' | 'permission-denied';

let syncLock: Promise<SyncResult> = Promise.resolve('ok');

export async function syncReminders(data: ReminderData, enabled: boolean): Promise<SyncResult> {
  if (isWeb) return 'disabled';
  const run = syncLock.catch(() => 'ok' as SyncResult).then(() => doSyncReminders(data, enabled));
  // Keep the lock pointing at the latest run, swallowing errors so the chain
  // never gets stuck in a rejected state.
  syncLock = run.catch(() => 'ok' as SyncResult);
  return run;
}

async function doSyncReminders(data: ReminderData, enabled: boolean): Promise<SyncResult> {
  const Notifications = getNotifications();
  if (!Notifications) return 'disabled';

  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!enabled) return 'disabled';

  const granted = await requestNotificationPermission();
  if (!granted) return 'permission-denied';

  await ensureAndroidChannel(Notifications);

  const tasks: Promise<string>[] = [];

  // Daily habit reminders (dedupe by id so a habit can't schedule twice).
  const seenHabits = new Set<string>();
  for (const habit of data.habits) {
    if (seenHabits.has(habit.id)) continue;
    seenHabits.add(habit.id);
    const at = parseTime(habit.reminderTime);
    if (!at) continue;
    tasks.push(
      Notifications.scheduleNotificationAsync({
        content: {
          title: nt('notifReminders.habitTitle'),
          body: nt('notifReminders.habitBody', { name: habit.name }),
          sound: 'default',
          data: { kind: 'habit', id: habit.id, name: habit.name },
          ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: at.hour,
          minute: at.minute,
        },
      }),
    );
  }

  // Daily custom tracker reminders (dedupe by id).
  const seenTrackers = new Set<string>();
  for (const tracker of data.customTrackers) {
    if (seenTrackers.has(tracker.id)) continue;
    seenTrackers.add(tracker.id);
    if (!tracker.reminder) continue;
    const at = parseTime(tracker.reminderTime);
    if (!at) continue;
    tasks.push(
      Notifications.scheduleNotificationAsync({
        content: {
          title: tracker.name,
          body: nt('notifReminders.customBody', { name: tracker.name }),
          sound: 'default',
          data: { kind: 'custom', id: tracker.id, name: tracker.name },
          ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: at.hour,
          minute: at.minute,
        },
      }),
    );
  }

  // Task due-date reminders (one-shot, 09:00 on the due day; dedupe by id).
  const now = Date.now();
  const seenTasks = new Set<string>();
  for (const task of data.tasks) {
    if (seenTasks.has(task.id)) continue;
    seenTasks.add(task.id);
    if (task.done) continue;
    const due = new Date(task.due);
    if (Number.isNaN(due.getTime())) continue;
    const fireAt = new Date(due.getFullYear(), due.getMonth(), due.getDate(), 9, 0, 0, 0);
    if (fireAt.getTime() <= now) continue;
    tasks.push(
      Notifications.scheduleNotificationAsync({
        content: {
          title: nt('notifReminders.taskTitle'),
          body: nt('notifReminders.taskBody', { name: task.name }),
          sound: 'default',
          data: { kind: 'task', id: task.id, name: task.name },
          ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fireAt,
        },
      }),
    );
  }

  if (data.retentionNotificationsEnabled) {
    const retention = selectRetentionCandidates({
      ...data,
      notifiedAchievementIds: data.retentionNotifiedAchievementIds,
      lastInactivityNotificationAt: data.retentionLastInactivityNotificationAt,
    });
    const milestoneIds: string[] = [];
    let inactivityScheduled = false;
    for (const candidate of retention) {
      const fireAt = localDateFromKey(candidate.date);
      fireAt.setHours(candidate.hour, candidate.minute, 0, 0);
      if (fireAt.getTime() <= now) continue;
      if (isWithinQuietHours(fireAt, data.quietHoursEnabled, data.quietHoursStart, data.quietHoursEnd)) continue;
      if (candidate.achievementId) milestoneIds.push(candidate.achievementId);
      if (candidate.kind === 'inactivity') inactivityScheduled = true;
      const copy =
        candidate.kind === 'weekly-review'
          ? ['notifReminders.weeklyReviewTitle', 'notifReminders.weeklyReviewBody']
          : candidate.kind === 'streak-protection'
            ? ['notifReminders.streakTitle', 'notifReminders.streakBody']
            : candidate.kind === 'milestone'
              ? ['notifReminders.milestoneTitle', 'notifReminders.milestoneBody']
              : ['notifReminders.inactivityTitle', 'notifReminders.inactivityBody'];
      tasks.push(
        Notifications.scheduleNotificationAsync({
          content: {
            title: nt(copy[0]),
            body: nt(copy[1]),
            sound: 'default',
            data: { kind: 'retention', stableId: candidate.stableId, achievementId: candidate.achievementId },
            ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt },
        }),
      );
    }
    if (milestoneIds.length > 0) data.onRetentionAchievementsScheduled?.(milestoneIds);
    if (inactivityScheduled) data.onRetentionInactivityScheduled?.(new Date().toISOString());
  }

  await Promise.all(tasks);
  return 'ok';
}
