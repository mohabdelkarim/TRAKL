/**
 * Native no-op for PostHog.
 * The real implementation lives in posthog.web.ts and is only loaded on web
 * via Metro's platform extension resolution (.web.ts).
 * This prevents the browser-only posthog-js library from being evaluated
 * in the native (Hermes) bundle.
 */
export function initPostHog(): void {
  // no-op on native
}
