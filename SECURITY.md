# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in TRAKL, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Email: security@trakl.app
3. Include a description of the vulnerability and steps to reproduce

## Response Timeline

- **Acknowledgment**: within 48 hours
- **Initial assessment**: within 7 days
- **Fix or mitigation**: depends on severity (critical within 30 days, high within 60 days)

## Security Measures

### Data Protection
- Financial transactions encrypted at rest via `expo-secure-store` (iOS Keychain / Android Keystore)
- All other data stored locally via AsyncStorage — no backend, no cloud, no telemetry
- No user accounts, no authentication tokens, no PII transmitted

### CI/CD Security
- **SAST**: Semgrep static analysis on every PR
- **Dependency scanning**: OSV-Scanner + Trivy + Grype
- **Secret scanning**: TruffleHog (verified secrets only) + GitHub secret scanning
- **IaC scanning**: Checkov + KICS for GitHub Actions and Dockerfile
- **Least-privilege**: GitHub Actions workflows use minimal permissions

### Secret Management
- No hardcoded secrets in the codebase
- Production identifiers (AdMob IDs, bundle IDs, EAS project ID) read from environment variables
- Signing credentials stored exclusively on EAS servers, never in the repository
- `.gitignore` covers `.env`, `*.jks`, `*.p12`, `*.key`, `*.pem`, `*.mobileprovision`

### App Security
- No backend API surface to attack
- Reverse engineering the APK/IPA reveals only test AdMob IDs (production IDs injected at build time)
- Signing keys cannot be extracted from the repo
