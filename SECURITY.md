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
- All other data stored locally via AsyncStorage. No backend, no cloud sync of tracker entries
- No user accounts, no authentication tokens, no PII transmitted for core tracking

### CI/CD Security
- **SAST**: Semgrep static analysis on every PR
- **Dependency scanning**: OSV-Scanner + Trivy + Grype
- **Secret scanning**: TruffleHog (verified secrets only) + GitHub secret scanning
- **IaC scanning**: Checkov + KICS for GitHub Actions
- **Least privilege**: GitHub Actions workflows use minimal permissions

### Secret Management
- No hardcoded secrets in the codebase
- Bundle IDs and Expo project ID read from environment variables
- `.gitignore` covers `.env`, `*.jks`, `*.p12`, `*.key`, `*.pem`, `*.mobileprovision`

### App Security
- No backend API surface to attack for tracker data
- Signing material is not committed to the repository
