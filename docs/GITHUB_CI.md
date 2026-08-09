# GitHub Actions — Android Release Build

Builds a signed release `.aab` (and optionally `.apk`) for **TRAKL** on a GitHub-hosted Ubuntu runner, without EAS quota, Android Studio, or a local Gradle setup.

The workflow runs `expo prebuild` to regenerate the native `android/` project, then builds it directly with Gradle (`./gradlew bundleRelease`). It never calls `eas build`, so no EAS quota is consumed and no `EXPO_TOKEN` is required.

## What it produces

- **App Bundle (`.aab`)** — production release, signed with your upload key.
- **Optional APK (`.apk`)** — when `release-apk` is selected on manual trigger.
- **Mapping file** — for Play Console deobfuscation.

All outputs are uploaded as **GitHub Actions artifacts** (30-day retention).

## Repository secrets

Configure these under `Settings → Secrets and variables → Actions → New repository secret`. They are referenced by name only in the workflow — no values are ever committed.

| Secret | Purpose |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded upload keystore (`.p12`) |
| `ANDROID_KEYSTORE_PASSWORD` | Password for the `.p12` keystore |
| `ANDROID_KEY_ALIAS` | Key alias inside the keystore (e.g. `upload`) |
| `ANDROID_KEY_PASSWORD` | Password for the key (often same as the store password) |

## Repository variables

Configure these under `Settings → Secrets and variables → Actions → Variables tab`. They control which application identifiers Gradle builds with.

| Variable | Purpose |
| --- | --- |
| `TRAKL_ANDROID_PACKAGE` | Real Android `applicationId` from Play Console |
| `TRAKL_IOS_BUNDLE_ID` | iOS bundle identifier |

If unset, the workflow falls back to the placeholder `com.example.trakl`, which will **not** match an existing Play Console listing — set the real value before your first release.

## Triggering a build

- **Manual**: `Actions → React Native CI/CD (Android Release) → Run workflow`
  - `build_type`: `release-aab` (default) or `release-apk`
  - `version_code`: must be greater than the last version uploaded to Play Console
  - `version_name`: display version string, e.g. `1.0.1`
- **Automatic**: on every push to `main` (excluding `*.md`, `docs/**`, `.github/**`)

## Pipeline steps

| Step | What it does |
| --- | --- |
| 1. Resolve inputs | Computes `versionCode`/`versionName` with safe defaults |
| 2. Checkout | Pulls the repository |
| 3. Setup JDK 17 | Temurin JDK 17 + Gradle cache |
| 4. Setup Node | Node.js + npm cache |
| 5. Setup Android SDK | Platform, build-tools, NDK |
| 6. `npm ci` | Clean install from `package-lock.json` |
| 7. `expo prebuild` | Regenerates `android/` from `app.config.ts` |
| 8. Decode keystore | Base64 secret → `android/app/upload-keystore.p12` |
| 9. `keytool` p12 → jks | Converts to JKS, prints SHA-1 for verification |
| 10. Patch `gradle.properties` | Injects signing config at build time only |
| 11. Verify versionCode | Confirms it's greater than the previous release |
| 12. `./gradlew bundleRelease` | Produces the signed `.aab` |
| 13. Verify AAB signing | Prints SHA-1 of the signed bundle |
| 14. Upload AAB artifact | `app-release.aab` (30-day retention) |
| 15. Upload mapping | `mapping.txt` for Play Console deobfuscation |

## Troubleshooting

**`Plugin [id: 'com.facebook.react.settings'] was not found`**
`expo prebuild` didn't run or `node_modules` is missing — ensure `npm ci` runs before prebuild.

**`Missing Android release signing properties.`**
One or more of the 4 required secrets is missing or empty — check `Settings → Secrets`.

**`keytool error: ... Integrity check failed`**
Wrong keystore password — re-check `ANDROID_KEYSTORE_PASSWORD`.

**`Could not find tools.jar`**
JDK wasn't installed correctly — confirm `setup-java` uses the `temurin` distribution.

**`SDK location not found`**
`android/local.properties` is missing. Add a step to write it if `android-actions/setup-android` doesn't:

```yaml
- name: Write local.properties
  run: echo "sdk.dir=$ANDROID_HOME" >> android/local.properties
```

**Play Console rejects the upload with an "existing users can't upgrade" error**
Usually means the new `.aab` isn't compatible with the live release. Check, in order:

1. **`applicationId` / package name** — must match the app already listed in Play Console; controlled by the `TRAKL_ANDROID_PACKAGE` variable.
2. **`versionCode`** — must be strictly greater than the last uploaded version code.
3. **Signing certificate SHA-1** (most common cause) — the workflow prints the upload certificate's SHA-1; compare it against `Play Console → App integrity → App signing → Upload key certificate`. If it differs, request a new upload key or use the original keystore.

**Play Console warns about a missing deobfuscation file**
This is a warning, not an error. Download the `android-mapping` artifact from the Actions run and upload `mapping.txt` under `Release → Deobfuscation files`. It's only produced when the release build runs with `minifyEnabled true` (the Expo release template default).

## Security notes

- `android/gradle.properties` is patched with signing credentials **at build time only**, inside the CI runner — it is never written with real credentials in the source tree.
- Rotate the keystore password and re-generate the upload key if it was ever committed to a repository or shared outside GitHub Secrets.
- Consider scoping secrets to a GitHub Environment (`Settings → Environments → production`) instead of repository-wide for tighter access control.
