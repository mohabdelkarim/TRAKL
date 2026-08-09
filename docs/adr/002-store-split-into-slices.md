# ADR-002: Zustand Store Split into Slices

## Status
Accepted

## Context
The TRAKL Zustand store was a single 818-line monolithic file (`store.ts`) containing all state, actions, persistence config, and migration logic. This made it difficult to:
- Navigate and maintain specific feature areas
- Test individual slices in isolation
- Add new tracker types without touching shared code
- Review changes that span multiple concerns

## Decision
Split the monolithic store into domain-specific slices using Zustand's `StateCreator` pattern:

- `financeSlice.ts` — transactions and budget
- `habitsSlice.ts` — habit tracking
- `tasksSlice.ts` — task management
- `goalsSlice.ts` — goal milestones
- `plannerSlice.ts` — weekly planner events
- `healthSlice.ts` — sleep, workouts, mood, water, weight, meditation
- `customSlice.ts` — user-defined trackers
- `notificationsSlice.ts` — in-app notifications
- `settingsSlice.ts` — onboarding, profile, import/export, preferences

Each slice is a `StateCreator<TraklState, [], [], SliceType>` function. The main `store.ts` combines them via object spread in the `create()` initializer.

Shared types and constants live in `store/types.ts`. Migration logic lives in `store/migrations.ts`.

## Consequences
- **Positive**: Each slice is independently testable and maintainable.
- **Positive**: New trackers can be added by creating a new slice file and registering it.
- **Positive**: The main `store.ts` is now ~80 lines (just composition + persist config).
- **Negative**: Slices must be aware of the full `TraklState` type for cross-slice access.
- **Negative**: Slightly more files to navigate, but each is focused and small.

## Implementation
- `src/application/store/types.ts` — shared types, constants, interfaces
- `src/application/store/slices/*.ts` — individual slice creators
- `src/application/store/migrations.ts` — structured migration pipeline
- `src/application/store.ts` — composition root (~80 lines)
