# ADR-006: Per-Screen Error Boundaries

## Status
Accepted

## Context
The app had a single root-level error boundary (via expo-router's `ErrorBoundary` export). If any tracker screen crashed, the entire app would show the error screen with no way to recover without restarting.

## Decision
Add a `ScreenErrorBoundary` React component class and a `withErrorBoundary` HOC. Wrap the tracker route group with a `tracker/_layout.tsx` that encloses all tracker screens in a `ScreenErrorBoundary`.

The error boundary provides:
- A "Try Again" button that resets the error state
- The error message for debugging
- Console error logging in dev mode

## Consequences
- **Positive**: A crash in one tracker screen doesn't take down the whole app.
- **Positive**: Users can retry without restarting the app.
- **Positive**: The HOC pattern allows easy wrapping of any screen.
- **Negative**: Error boundaries don't catch errors in event handlers or async code (React limitation).

## Implementation
- `components/ScreenErrorBoundary.tsx` — boundary component + HOC
- `app/tracker/_layout.tsx` — wraps tracker Stack in ScreenErrorBoundary
