# ADR 007: Native crash reporting

## Status

Accepted (opt in)

## Context

Production iOS and Android builds need a way to see native fatals. PostHog already covers web preview embeds. Shipping a hard Sentry dependency without a DSN would add weight for no gain.

## Decision

Expose `initSentry` in `src/infrastructure/services/sentry.ts`. It is a no op when `SENTRY_DSN` is unset or `@sentry/react-native` is not installed. Call sites can stay ready without forcing the SDK into every clone.

## Consequences

Enabling crash reporting is install the package and set the DSN. Local Expo Go sessions stay quiet unless those are present.
