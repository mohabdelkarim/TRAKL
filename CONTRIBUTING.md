# Contributing to TRAKL

## Development Setup

1. Clone the repo
2. `npm ci`
3. `npx expo start`

### Prerequisites

- Node.js 20+
- Expo CLI (via `npx`, no global install required)
- Xcode and/or Android Studio for native builds

## Code Style

- **TypeScript strict mode** — no `any` without explicit eslint-disable
- **oxlint + oxfmt** — run automatically via pre-commit hooks (lefthook)
- **Conventional commits**: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`
- **No comments unless asked** — let the code be self-documenting

## Quality Checks

```bash
npm run typecheck        # TypeScript strict
npm test                  # Jest suite (73 tests)
npm run lint              # oxlint (type-aware)
npm run knip              # Unused files/exports
npm run jscpd             # Duplicate code detection
npm run semgrep           # SAST
npm run osv-scanner       # Dependency vulnerabilities
```

## Pull Requests

1. Create a feature branch from `main`
2. Ensure all CI checks pass (typecheck, lint, tests, SAST, dependency scan, secret scan)
3. Request review
4. Squash merge

## Architecture

TRAKL follows a layered architecture:

```
app/              Expo Router screens (thin controllers)
components/       Reusable presentation-only UI
src/domain/       Types & tracker metadata (no I/O, no React)
src/application/  Zustand store, stats, backup, achievements
src/infrastructure/  Native services (i18n, ads, notifications, secure storage)
src/shared/       Theme, fonts, haptics, formatting utils
```

Read `docs/adr/` for architectural decision records (6 ADRs covering secure storage, store slices, ID generation, migrations, CI consolidation, and error boundaries).

## Testing

- **Unit tests**: Jest + React Native Testing Library (`__tests__/`)
- **E2E**: Maestro smoke tests (`.maestro/smoke-test.yaml`)
- **Migration tests**: Idempotent test cases for store version migrations
- **Security tests**: Verify partialize exclusion and secure storage calls

## Adding a New Tracker

1. Add the tracker key to `src/domain/trackers.ts`
2. Add types to `src/domain/types.ts`
3. Create a store slice in `src/application/store/slices/`
4. Add stats functions in `src/application/stats/`
5. Create the screen in `app/tracker/`
6. Add tests in `__tests__/`
