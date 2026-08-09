import { RETENTION_DEFAULTS, WATER_GOAL } from './types';

/**
 * Structured, versioned migration framework.
 *
 * Each step is a named, pure function that transforms a persisted record.
 * Steps are applied in order, wrapped in a try/catch so a single bug
 * never discards the whole persisted blob.
 *
 * All steps are idempotent — applying them to an already-migrated record
 * is a no-op. This is critical because Zustand's persist middleware
 * calls migrate once on rehydration with the persisted version.
 */

type MigrationRecord = Record<string, unknown>;

/** A single named migration step. */
interface MigrationStep {
  name: string;
  fn: (record: MigrationRecord) => MigrationRecord;
}

// ---------- Individual migration steps ----------

const backfillCustomTrackerLogs: MigrationStep = {
  name: 'customTrackerLogs',
  fn: (record) => {
    if (!Array.isArray(record.customTrackers)) return record;
    return {
      ...record,
      customTrackers: record.customTrackers.map((c: unknown) => {
        if (!c || typeof c !== 'object') return { logs: [] };
        const tracker = { ...(c as Record<string, unknown>) };
        if (!Array.isArray(tracker.logs)) tracker.logs = [];
        return tracker;
      }),
    };
  },
};

const backfillTaskCompletedAt: MigrationStep = {
  name: 'taskCompletedAt',
  fn: (record) => {
    if (!Array.isArray(record.tasks)) return record;
    return {
      ...record,
      tasks: record.tasks.map((tk: unknown) => {
        if (!tk || typeof tk !== 'object') return tk;
        const task = { ...(tk as Record<string, unknown>) };
        if (task.done === true && typeof task.completedAt !== 'string') {
          task.completedAt =
            typeof task.due === 'string' ? task.due : new Date().toISOString();
        }
        return task;
      }),
    };
  },
};

const backfillProfileMemberSince: MigrationStep = {
  name: 'profileMemberSince',
  fn: (record) => {
    if (!record.profile || typeof record.profile !== 'object') return record;
    const profile = { ...(record.profile as Record<string, unknown>) };
    if (typeof profile.memberSince !== 'string' || !profile.memberSince) {
      profile.memberSince = new Date().toISOString();
    }
    return { ...record, profile };
  },
};

const backfillPinnedTrackers: MigrationStep = {
  name: 'pinnedTrackers',
  fn: (record) => {
    if (!Array.isArray(record.pinnedTrackers)) record.pinnedTrackers = [];
    return record;
  },
};

const backfillPlannerWeekOffset: MigrationStep = {
  name: 'plannerWeekOffset',
  fn: (record) => {
    if (!Array.isArray(record.planner)) return record;
    return {
      ...record,
      planner: record.planner.map((ev: unknown) => {
        if (!ev || typeof ev !== 'object') return ev;
        const event = { ...(ev as Record<string, unknown>) };
        if (typeof event.weekOffset !== 'number') event.weekOffset = 0;
        return event;
      }),
    };
  },
};

const backfillNewTrackerArrays: MigrationStep = {
  name: 'newTrackerArrays',
  fn: (record) => {
    if (!Array.isArray(record.mood)) record.mood = [];
    if (!Array.isArray(record.water)) record.water = [];
    if (!Array.isArray(record.weight)) record.weight = [];
    if (!Array.isArray(record.meditation)) record.meditation = [];
    return record;
  },
};

const backfillEnabledTrackers: MigrationStep = {
  name: 'enabledTrackers',
  fn: (record) => {
    if (Array.isArray(record.enabledTrackers)) {
      const existing = record.enabledTrackers.filter(
        (k): k is string => typeof k === 'string',
      );
      for (const k of ['mood', 'water', 'weight', 'meditation']) {
        if (!existing.includes(k)) existing.push(k);
      }
      record.enabledTrackers = existing;
    }
    return record;
  },
};

const backfillWaterGoal: MigrationStep = {
  name: 'waterGoal',
  fn: (record) => {
    if (typeof record.waterGoal !== 'number') record.waterGoal = WATER_GOAL;
    return record;
  },
};

const backfillRetentionSettings: MigrationStep = {
  name: 'retentionSettings',
  fn: (record) => {
    if (typeof record.retentionNotificationsEnabled !== 'boolean')
      record.retentionNotificationsEnabled = RETENTION_DEFAULTS.retentionNotificationsEnabled;
    if (typeof record.quietHoursEnabled !== 'boolean')
      record.quietHoursEnabled = RETENTION_DEFAULTS.quietHoursEnabled;
    if (typeof record.quietHoursStart !== 'string')
      record.quietHoursStart = RETENTION_DEFAULTS.quietHoursStart;
    if (typeof record.quietHoursEnd !== 'string')
      record.quietHoursEnd = RETENTION_DEFAULTS.quietHoursEnd;
    return record;
  },
};

const backfillRetentionNotifiedIds: MigrationStep = {
  name: 'retentionNotifiedIds',
  fn: (record) => {
    if (!Array.isArray(record.retentionNotifiedAchievementIds)) {
      record.retentionNotifiedAchievementIds = Array.isArray(record.achievements)
        ? record.achievements
            .filter((achievement: unknown) => {
              return (
                achievement !== null &&
                typeof achievement === 'object' &&
                (achievement as { unlocked?: unknown }).unlocked === true
              );
            })
            .map((achievement: unknown) => (achievement as { id: string }).id)
        : [];
    }
    return record;
  },
};

const backfillRetentionLastInactivity: MigrationStep = {
  name: 'retentionLastInactivity',
  fn: (record) => {
    if (typeof record.retentionLastInactivityNotificationAt !== 'string')
      record.retentionLastInactivityNotificationAt = undefined;
    return record;
  },
};

const backfillNotificationTitles: MigrationStep = {
  name: 'notificationTitles',
  fn: (record) => {
    if (!Array.isArray(record.notifications)) return record;
    record.notifications = record.notifications
      .map((n: unknown) => {
        if (!n || typeof n !== 'object') return n;
        const notif = { ...(n as Record<string, unknown>) };
        if (typeof notif.title !== 'string' || !notif.title) {
          notif.title = typeof notif.message === 'string' ? notif.message : 'Notification';
        }
        return notif;
      })
      .filter((n: unknown) => {
        if (!n || typeof n !== 'object') return false;
        const notif = n as Record<string, unknown>;
        return Boolean(
          (typeof notif.title === 'string' && notif.title.trim()) ||
            (typeof notif.message === 'string' && notif.message.trim()),
        );
      });
    return record;
  },
};

const resetStaleBudget: MigrationStep = {
  name: 'resetStaleBudget',
  fn: (record) => {
    if (record.monthlyBudget === 1600) {
      const hasTx = Array.isArray(record.transactions) && record.transactions.length > 0;
      if (!hasTx) record.monthlyBudget = 0;
    }
    return record;
  },
};

const backfillAllTrackerArrays: MigrationStep = {
  name: 'allTrackerArrays',
  fn: (record) => {
    const keys = [
      'transactions',
      'habits',
      'tasks',
      'goals',
      'planner',
      'sleep',
      'workouts',
      'mood',
      'water',
      'weight',
      'meditation',
      'customTrackers',
    ];
    for (const key of keys) {
      if (!Array.isArray(record[key])) record[key] = [];
    }
    return record;
  },
};

// ---------- Ordered migration pipeline ----------

const MIGRATION_STEPS: MigrationStep[] = [
  backfillCustomTrackerLogs,
  backfillTaskCompletedAt,
  backfillProfileMemberSince,
  backfillPinnedTrackers,
  backfillPlannerWeekOffset,
  backfillNewTrackerArrays,
  backfillEnabledTrackers,
  backfillWaterGoal,
  backfillRetentionSettings,
  backfillRetentionNotifiedIds,
  backfillRetentionLastInactivity,
  backfillNotificationTitles,
  resetStaleBudget,
  backfillAllTrackerArrays,
];

/**
 * Apply all migration steps in order.
 * Never throws — on error, returns the original persisted object
 * so the user's real data is preserved.
 */
export function migrate(persisted: unknown, _version: number): unknown {
  try {
    if (!persisted || typeof persisted !== 'object') return persisted;
    let record: MigrationRecord = { ...(persisted as Record<string, unknown>) };
    for (const step of MIGRATION_STEPS) {
      record = step.fn(record);
    }
    return record;
  } catch {
    return persisted;
  }
}
