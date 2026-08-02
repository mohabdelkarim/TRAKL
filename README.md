# TRAKL

A local-first life tracker app built with Expo / React Native. Track habits, tasks, finances, sleep, workouts, mood, water intake, weight, meditation, goals, and custom trackers — all stored on-device with Zustand + AsyncStorage. Available in 20 languages with AdMob banner ads (with GDPR/UMP consent).

## Tech Stack

- **Framework**: Expo SDK 54, React Native 0.81
- **State**: Zustand with AsyncStorage persistence (encrypted via expo-secure-store for financial data)
- **Navigation**: Expo Router (file-based)
- **Styling**: Uniwind / TailwindCSS
- **i18n**: i18next (20 languages, RTL support)
- **Ads**: react-native-google-mobile-ads (AdMob banners with UMP consent + ATT). This public copy ships Google's official test ad unit/App IDs; production IDs are supplied via env vars and are not committed.
- **Notifications**: expo-notifications (local scheduling)
- **CI**: GitHub Actions (Android/iOS release builds). Workflows reference signing secrets (keystore, Apple certs) by name only — no secret values or real signing material are committed, and the release jobs will not run without secrets configured in your own fork.

## Getting Started

```bash
# Install dependencies
npm ci

# Start the dev server
npm start

# Run on Android / iOS / Web
npm run android
npm run ios
npm run web

# Type checking
npm run typecheck

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Project Structure

```
app/          # Expo Router pages (tabs, tracker screens)
components/   # Reusable UI components
src/          # Application, domain, infrastructure, shared layers
  application/    # Store, stats, seed, backup, achievements, weekly, hooks
  domain/         # Trackers, types
  infrastructure/ # Services (i18n, notifications, AdMob, consent, posthog), storage
  shared/         # Theme, fonts, haptics, avatar, utils
assets/       # Images, fonts, onboarding assets
__tests__/    # Jest test files
```

## Key Files

- `src/application/store.ts` — Zustand store with persistence, migrations, and all actions
- `src/infrastructure/services/consent.ts` — GDPR/UMP consent via Google AdsConsent SDK
- `src/infrastructure/storage/secureStorage.ts` — Encrypted storage for financial transactions
- `src/infrastructure/services/i18n.ts` — Internationalization with RTL layout direction
- `app.config.ts` — Expo config (versioning, AdMob, permissions)
- `.github/workflows/` — Android release CI/CD

## Privacy

All user data is stored locally on-device. Financial transactions are encrypted at rest using expo-secure-store. No data is sent to any server. AdMob ads require GDPR/UMP consent (handled via the official Google UMP SDK) and iOS ATT prompt.

## License

Private project. All rights reserved.
