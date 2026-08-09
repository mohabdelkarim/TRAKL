# GitHub Repository Settings — Pre-Public Checklist

Complete these steps in the GitHub UI before making the repo public.

## 1. Branch Protection (Settings → Branches → Add rule)

- **Branch name pattern**: `main`
- [x] Require pull request before merging
- [x] Require approvals: at least 1
- [x] Require status checks to pass:
  - `ci.yml` (typecheck + tests)
  - `code-quality.yml` (lint, knip, jscpd)
  - `sast-scan.yml` (Semgrep, TruffleHog, Checkov, KICS)
  - `dependency-scan.yml` (OSV-Scanner)
  - `vuln-scan.yml` (Trivy, Grype)
- [x] Require branches to be up to date before merging
- [x] Do not allow bypassing the above settings
- [x] Require linear history (squash merges)

## 2. Security & Analysis (Settings → Security & analysis)

- [x] Dependabot alerts — **Enable**
- [x] Dependabot security updates — **Enable**
- [x] Secret scanning — **Enable** (free for public repos)
- [x] Push protection — **Enable** (free for public repos)
- [x] Code scanning (CodeQL) — optional, Semgrep already covers SAST

## 3. General Settings (Settings → General)

- [x] Allow fork splitting
- [x] Enable Issues
- [x] Enable Projects (for portfolio showcase)
- [x] Enable Discussions (optional, for community Q&A)
- [x] Enable Sponsor button (optional)

## 4. Repository Description & Topics

**Description**:
```
TRAKL — Privacy-first life tracker. Finance, habits, tasks, goals, health. 100% local, no backend. React Native + Expo.
```

**Topics** (add all of these):
```
react-native, expo, typescript, zustand, mobile-app,
local-first, privacy, finance-tracker, habit-tracker,
expo-router, nativewind, i18n, portfolio
```

## 5. Social Preview

Upload a custom social preview image (1280×640) showing the app's key screens.

## 6. Release Settings

- [x] Enable Releases
- [x] Create a `v1.0.0` release tag with the CHANGELOG.md content

## 7. Verify CI Workflows Pass

Before making public, ensure all 5 workflows pass on `main`:
```bash
gh run list --limit 5
```
