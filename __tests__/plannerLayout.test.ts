import { describe, it, expect } from '@jest/globals';

import { layoutDayEvents } from '@/src/application/stats/plannerLayout';
import type { PlannerEvent } from '@/src/domain/types';

function ev(id: string, startHour: number, durationHours: number): PlannerEvent {
  return {
    id,
    title: id,
    day: 0,
    weekOffset: 0,
    startHour,
    durationHours,
    color: '#000',
  };
}

describe('layoutDayEvents', () => {
  it('gives full width to a single event', () => {
    const [a] = layoutDayEvents([ev('a', 9, 1)]);
    expect(a.column).toBe(0);
    expect(a.columnCount).toBe(1);
  });

  it('places overlapping events in separate columns', () => {
    const laid = layoutDayEvents([ev('a', 9, 3), ev('b', 10, 1)]);
    const byId = Object.fromEntries(laid.map((e) => [e.id, e]));
    expect(byId.a.column).not.toBe(byId.b.column);
    expect(byId.a.columnCount).toBe(2);
    expect(byId.b.columnCount).toBe(2);
  });

  it('reuses a column when events do not overlap', () => {
    const laid = layoutDayEvents([ev('a', 9, 1), ev('b', 11, 1)]);
    const byId = Object.fromEntries(laid.map((e) => [e.id, e]));
    expect(byId.a.column).toBe(0);
    expect(byId.b.column).toBe(0);
    expect(byId.a.columnCount).toBe(1);
    expect(byId.b.columnCount).toBe(1);
  });

  it('keeps separate clusters independent', () => {
    const laid = layoutDayEvents([ev('a', 9, 2), ev('b', 10, 1), ev('c', 14, 1), ev('d', 14, 2)]);
    const byId = Object.fromEntries(laid.map((e) => [e.id, e]));
    expect(byId.a.columnCount).toBe(2);
    expect(byId.c.columnCount).toBe(2);
    expect(byId.a.columnCount).toBe(byId.b.columnCount);
  });
});
