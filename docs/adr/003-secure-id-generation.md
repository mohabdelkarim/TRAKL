# ADR-003: Cryptographically Secure ID Generation

## Status
Accepted

## Context
The app previously generated IDs using `Math.random().toString(36).slice(2, 10)`. This approach has two problems:
1. **Security**: `Math.random()` is not cryptographically secure — outputs can be predicted.
2. **Collision risk**: 8-character base36 strings have ~2^41 bits of entropy, which is insufficient for large datasets and can produce collisions.

## Decision
Replace all `Math.random()`-based ID generation with a `generateId()` utility (`src/shared/utils/id.ts`) that uses:
1. `crypto.randomUUID()` when available (web, modern React Native)
2. `crypto.getRandomValues()` with UUID v4 bit manipulation as fallback
3. `Date.now() + Math.random()` as last resort (always available)

The utility is used in all store slice actions (addTransaction, addHabit, addTask, etc.) and any other code that creates new entities.

## Consequences
- **Positive**: IDs are globally unique (UUID v4 format) with ~122 bits of entropy.
- **Positive**: No collision risk for any practical dataset size.
- **Positive**: Graceful degradation across platforms (web, native, older runtimes).
- **Negative**: IDs are longer (36 chars vs 8 chars) — negligible storage impact.
- **Negative**: `crypto.randomUUID` may require polyfill on older React Native versions.

## Implementation
- `src/shared/utils/id.ts` — `generateId()` utility with fallbacks
- All slice files import and use `generateId()` instead of inline `Math.random()`
- `__tests__/security.test.ts` — verifies uniqueness across 1000 generations
