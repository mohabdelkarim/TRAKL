# ADR 008: Bundle size analysis

## Status

Accepted (tooling deferred)

## Context

After the store and stats splits we need a baseline for JS bundle growth, but there is no continuous bundle size gate yet.

## Decision

Prefer Expo Atlas when measuring (`npx expo-atlas`, or `EXPO_ATLAS=1` during export). Optionally add `source-map-explorer` against a production Metro bundle later for CI diffable numbers. Keep this opt in until a baseline exists.

## Consequences

CI stays lean. Bundle growth can still be measured when a PR needs it.
