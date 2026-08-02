# Security Policy

This is a personal portfolio project. It is provided as-is for demonstration purposes.

## Reporting a Vulnerability

If you discover a security issue (e.g. a dependency vulnerability or a code-level flaw), please open a GitHub issue or contact the repository owner directly rather than disclosing it publicly.

## Notes for Contributors / Forkers

- All AdMob App IDs and Ad Unit IDs committed to this repository are Google's official **test** IDs. Replace them with your own IDs via environment variables (`TRAKL_ADMOB_ANDROID_APP_ID`, `TRAKL_ADMOB_IOS_APP_ID`, etc.) before shipping a build with real ads.
- The Expo `owner`, `eas.projectId`, and bundle/package identifiers are placeholders. Configure your own via `TRAKL_EXPO_OWNER`, `TRAKL_EAS_PROJECT_ID`, `TRAKL_ANDROID_PACKAGE`, `TRAKL_IOS_BUNDLE_ID` env vars.
- CI workflows in `.github/workflows/` reference signing secrets (Android keystore, Apple certificates) by name only. No secret values or signing material are committed. Release build jobs will fail until you configure your own secrets in a fork.
- Never commit `.jks`, `.p12`, `.mobileprovision`, or `.env*` files — see `.gitignore`.
