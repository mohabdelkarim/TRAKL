import type { PlannerEvent } from '@/src/domain/types';

export type LaidOutPlannerEvent = PlannerEvent & {
  column: number;
  columnCount: number;
};

function eventEnd(e: PlannerEvent): number {
  return e.startHour + e.durationHours;
}

function overlaps(a: PlannerEvent, b: PlannerEvent): boolean {
  return a.startHour < eventEnd(b) && b.startHour < eventEnd(a);
}

/**
 * Pack overlapping day events into side-by-side columns (calendar-style).
 * Non-overlapping clusters keep full width; overlapping ones share the row.
 */
export function layoutDayEvents(events: PlannerEvent[]): LaidOutPlannerEvent[] {
  if (events.length === 0) return [];

  const parent = new Map(events.map((e) => [e.id, e.id]));
  const find = (id: string): string => {
    const p = parent.get(id) ?? id;
    if (p !== id) {
      const root = find(p);
      parent.set(id, root);
      return root;
    }
    return id;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      if (overlaps(events[i], events[j])) union(events[i].id, events[j].id);
    }
  }

  const clusters = new Map<string, PlannerEvent[]>();
  for (const e of events) {
    const root = find(e.id);
    const list = clusters.get(root) ?? [];
    list.push(e);
    clusters.set(root, list);
  }

  const out: LaidOutPlannerEvent[] = [];
  for (const cluster of Array.from(clusters.values())) {
    const sorted = [...cluster].sort(
      (a, b) =>
        a.startHour - b.startHour || b.durationHours - a.durationHours || a.id.localeCompare(b.id),
    );
    const colEnds: number[] = [];
    const cols = new Map<string, number>();

    for (const e of sorted) {
      let col = colEnds.findIndex((end) => end <= e.startHour);
      if (col === -1) {
        col = colEnds.length;
        colEnds.push(eventEnd(e));
      } else {
        colEnds[col] = eventEnd(e);
      }
      cols.set(e.id, col);
    }

    const columnCount = Math.max(1, colEnds.length);
    for (const e of sorted) {
      out.push({ ...e, column: cols.get(e.id) ?? 0, columnCount });
    }
  }

  return out;
}
