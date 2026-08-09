<div align="center">
  <img src="./assets/logo.png" width="96" alt="TRAKL logo" />

  # TRAKL

  **A local-first life tracker for habits, finances, sleep, fitness, and more — no account, no cloud, no data leaving your device.**

  ![Expo SDK 54](https://img.shields.io/badge/Expo-SDK%2054-000020?logo=expo&logoColor=white)
  ![React Native 0.81](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react&logoColor=white)
  ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
  ![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
</div>

<p align="center">
  <img src="./assets/onboarding/hook.png" width="260" alt="TRAKL onboarding hook screen" />
  <img src="./assets/onboarding/preview.png" width="260" alt="TRAKL onboarding preview screen" />
</p>

---

## What is TRAKL?

TRAKL is a cross-platform (iOS / Android / Web) life-tracking app built with Expo and React Native. It bundles **12 trackers** — Finance, Habits, Tasks, Goals, Planner, Sleep, Fitness, Mood, Water, Weight, Meditation, and a fully Custom tracker — into a single, fast, offline-first app with **zero backend**. Everything a user logs stays on their device.

### Highlights

- **12 built-in trackers** plus a user-defined Custom tracker type
- **20 languages** with full RTL support (Arabic, Urdu, and more) via i18next
- **No account, no server** — all data is stored on-device with Zustand + AsyncStorage
- **Encrypted financial data** — transactions are stored via `expo-secure-store` (iOS Keychain / Android Keystore), not plain AsyncStorage
- **Local notifications**, streaks, achievements, weekly reviews, and CSV/JSON backup & restore
- **GDPR/UMP-compliant ads** — Google's official UMP consent flow gates AdMob banners, with iOS ATT support
- **Test-covered** — Jest test suite for store, stats, backup, retention, security, and startup behavior

## Screens

| Onboarding | Daily tracking |
| :---: | :---: |
| <img src="./assets/onboarding/hook.png" width="220" /> | <img src="./assets/onboarding/preview.png" width="220" /> |

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | Expo SDK 54, React Native 0.81, React 19 |
| Language | TypeScript 5.7 (strict mode) |
| Navigation | Expo Router (file-based, typed routes) |
| State | Zustand (sliced store with persist + versioned migrations) |
| Secure storage | `expo-secure-store` (Keychain / Keystore) for financial data |
| Styling | Uniwind / Tailwind CSS (NativeWind) |
| i18n | i18next + react-i18next (20 languages, RTL support) |
| Ads | `react-native-google-mobile-ads` with Google UMP consent + iOS ATT |
| Notifications | `expo-notifications` (local scheduling only) |
| Testing | Jest + `@testing-library/react-native` (73 tests) |
| E2E | Maestro smoke tests |
| Code quality | oxlint, oxfmt, Knip, jscpd, ast-grep |
| Security scanning | Semgrep, OSV-Scanner, Trivy, Grype, TruffleHog, Checkov, KICS |

## Architecture

TRAKL follows a light layered architecture to keep UI, business logic, and platform concerns separate:

```
app/                    Expo Router screens (tabs + tracker routes)
components/             Reusable, presentation-only UI components
src/
  domain/                 Tracker definitions, shared types — no I/O, no React
  application/            Zustand store, stats, backup, achievements, seed data
  infrastructure/
    services/               i18n, notifications, AdMob, GDPR/UMP consent, analytics
    storage/                Encrypted storage for sensitive (financial) data
  shared/                 Theme, fonts, haptics, avatar, formatting utils
assets/                 App icon, splash screen, onboarding illustrations
__tests__/              Jest test suite
```

- **`domain/`** has no dependency on React Native or storage — pure types and tracker metadata, easy to unit test.
- **`application/`** owns state (`store.ts`) and cross-tracker logic (stats, weekly review, achievements, backup/restore).
- **`infrastructure/`** wraps every native/third-party integration (notifications, ads, consent, analytics) behind small service modules, and isolates encrypted storage from regular `AsyncStorage`.
- **`shared/`** holds cross-cutting, dependency-free utilities (theme tokens, formatting, haptics).

This separation keeps tracker screens thin, makes the store and stats logic testable without mocking React Native, and means a native module (e.g. the ads SDK) can be swapped without touching business logic.

## Security & Privacy

TRAKL is designed around the principle that a life-tracking app should never need a server:

- **On-device only** — no user account, no backend API, no telemetry endpoint that stores personal data. All trackers persist locally via Zustand + AsyncStorage.
- **Encrypted at rest for sensitive data** — financial transactions go through `src/infrastructure/storage/secureStorage.ts`, backed by the OS Keychain (iOS) / Keystore (Android) via `expo-secure-store`, not plaintext AsyncStorage.
- **Explicit, standards-based consent** — ads only render after the official Google UMP consent flow (`src/infrastructure/services/consent.ts`) resolves, and iOS App Tracking Transparency is respected.
- **No committed secrets** — signing keystores, provisioning profiles, and API tokens are never committed (see `.gitignore` and `SECURITY.md`); CI workflows reference secrets by name only and read platform/App IDs from environment variables with safe placeholder fallbacks.
- **Automated scanning** — the project ships `npm run` scripts for Semgrep (SAST), OSV-Scanner (dependency vulnerabilities), and Retire.js (known-vulnerable JS libraries), plus `oxlint`'s security plugin, so regressions are caught before release.
- **Backup you control** — export/import is local file-based (CSV/JSON), never uploaded anywhere automatically.

See `SECURITY.md` for the responsible-disclosure policy and environment-variable configuration for forks.

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (via `npx`, no global install required)
- Xcode (iOS) and/or Android Studio (Android) for native builds — not required for web or Expo Go

### Install & run

```bash
# Install dependencies
npm ci

# Start the Expo dev server
npm start

# Run on a specific platform
npm run android
npm run ios
npm run web
```

### Quality checks

```bash
npm run typecheck        # TypeScript strict type checking
npm test                  # Jest test suite
npm run test:coverage     # Jest with coverage report
npm run lint               # oxlint (type-aware)
npm run knip                # Unused files/exports/dependencies
npm run jscpd               # Duplicate code detection
npm run semgrep              # Static application security testing
npm run osv-scanner            # Dependency vulnerability scan
npm run retirejs                 # Known-vulnerable JS library scan
```

## Configuration

Production identifiers (Expo project, AdMob App IDs, bundle/package names) are **not hardcoded** — they're read from environment variables with safe, non-functional placeholders as fallbacks (see `app.config.ts`).

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `TRAKL_EXPO_OWNER`, `TRAKL_EAS_PROJECT_ID` | Your Expo/EAS account and project |
| `TRAKL_ANDROID_PACKAGE`, `TRAKL_IOS_BUNDLE_ID` | Native app identifiers |
| `TRAKL_ADMOB_ANDROID_APP_ID`, `TRAKL_ADMOB_IOS_APP_ID` | AdMob App IDs (defaults to Google's public test IDs) |
| `TRAKL_ADMOB_ANDROID_BANNER_UNIT_ID`, `TRAKL_ADMOB_IOS_BANNER_UNIT_ID` | AdMob banner ad unit IDs |

## Project Structure

See [Architecture](#architecture) above for the full breakdown of `app/`, `components/`, and `src/`.

## Testing

| Type | Tool | Coverage |
| --- | --- | --- |
| Unit tests | Jest + React Native Testing Library | 73 tests across 8 suites |
| E2E | Maestro smoke tests | Onboarding + home + trackers flow |
| Migration tests | Jest | Idempotent store version migrations |
| Security tests | Jest | Partialize exclusion + secure storage calls |

```bash
npm test                  # Run all 73 tests
npm run test:coverage     # With coverage report
```

## CI/CD

5 consolidated GitHub Actions workflows run on every PR and push to `main`:

| Workflow | Purpose |
| --- | --- |
| `ci.yml` | Typecheck + Jest tests |
| `code-quality.yml` | oxlint, oxfmt, Knip, jscpd, ast-grep |
| `sast-scan.yml` | Semgrep (SAST) + TruffleHog (secret scanning) + Checkov + KICS (IaC) |
| `dependency-scan.yml` | OSV-Scanner + Dependabot |
| `vuln-scan.yml` | Trivy + Grype (container & filesystem vulnerability scanning) |

## Architecture Decision Records

6 ADRs document key architectural decisions in `docs/adr/`:

1. **Secure storage for transactions** — Keychain/Keystore via `expo-secure-store`
2. **Store split into slices** — Domain-based Zustand slice architecture
3. **Secure ID generation** — UUID v4 for all entity IDs
4. **Versioned migration pipeline** — Idempotent store migrations with test coverage
5. **CI workflow consolidation** — 5 focused workflows instead of 15+ scattered ones
6. **Per-screen error boundaries** — Graceful degradation with `ScreenErrorBoundary`

## Download

<!-- Add store links when published -->

_Coming soon to the App Store and Google Play._

## License

This project is licensed under the **MIT License** — see [LICENSE](./LICENSE) for details.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup, code style, and PR guidelines.

## Security

See [SECURITY.md](./SECURITY.md) for the responsible disclosure policy.
