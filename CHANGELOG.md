# Changelog

All notable changes to TRAKL are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- License changed from MIT to GPL-3.0 with dual-license option (open source GPLv3 / commercial)
- Split `stats.ts` (983 lines) into domain-specific modules under `src/application/stats/`
- Optimized `bestStreak` and `habitStreak` — pre-compute completion Set instead of O(n×60) loop
- Added single-pass `monthSummary` to eliminate duplicate array iterations in finance stats
- Consolidated 19 individual `useTrakl()` calls in home screen into one `useShallow` selector
- Wrapped stats calculations in `useMemo` to prevent unnecessary re-computation on unrelated state changes
- `defaultProfile.memberSince` now uses `new Date().toISOString()` instead of hardcoded January 12

### Fixed
- `importAppData` now validates `saveTransactionsSecure` before setting state, preventing silent data loss on secure storage failure
- `ScreenErrorBoundary` now uses theme colors via `useColors()` instead of hardcoded `#007AFF`
- TruffleHog CI workflow pinned to valid `v3.96.0` tag with correct `path`/`base`/`head` inputs
- OSV-Scanner CI workflow pinned to valid `v2.5.0` tag with `scan-args`

### Added
- `testID` props on key screens for E2E testing (`home-screen`, `trackers-screen`, `onboarding-finish`)
- `PrimaryButton` now accepts `testID` prop
- Lefthook pre-commit hooks for typecheck, lint, and format checks
- Bundle analysis scripts (`bundle:android`, `bundle:ios`)
- GPL-3.0 LICENSE file with dual-license option
- Maestro E2E smoke test
- ADR documentation (secure storage, store slices, secure IDs, migration pipeline, CI consolidation, error boundaries)
- Per-screen error boundaries via `ScreenErrorBoundary` and tracker `_layout.tsx`
- Type-safe navigation helper `useTrackerNav`

## [1.0.9] — Version Code 22

### Added
- Multi-tracker support: finance, habits, tasks, goals, planner, sleep, fitness, mood, water, weight, meditation, custom
- Onboarding flow with tracker selection, profile setup, and language choice
- Analytics dashboard with life score, trends, and per-tracker insights
- Achievement system with milestone tracking
- Backup/restore via JSON export/import
- Secure storage for financial transactions
- Notification system with quiet hours and retention reminders
- Light/dark theme with system mode support
- Internationalization (i18n) with multiple languages
- CI/CD pipeline with SAST, dependency scanning, and vulnerability scanning
