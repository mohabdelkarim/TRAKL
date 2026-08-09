# ADR-004: Structured Versioned Migration Pipeline

## Status
Accepted

## Context
The previous migration function was a single large `try/catch` block with inline backfilling logic spanning ~140 lines. It was brittle, hard to test, and difficult to reason about which migrations applied when.

## Decision
Replace the monolithic migration with a structured pipeline of named, idempotent `MigrationStep` objects. Each step:
- Has a descriptive `name` for debugging
- Is a pure function `(record) => record`
- Is idempotent (applying it twice is a no-op)
- Handles a single concern (e.g., backfilling `waterGoal`, normalizing `notifications`)

Steps are applied in order inside the `migrate()` function, which wraps everything in a try/catch to preserve user data on error.

## Consequences
- **Positive**: Each migration step is independently testable.
- **Positive**: Steps can be added, removed, or reordered without touching others.
- **Positive**: Named steps appear in debugging output.
- **Positive**: Idempotency guarantees make re-migration safe.
- **Negative**: Slightly more boilerplate per step (object wrapper vs inline code).

## Implementation
- `src/application/store/migrations.ts` — step definitions and `migrate()` pipeline
- `__tests__/migration.test.ts` — tests each step independently and idempotency
