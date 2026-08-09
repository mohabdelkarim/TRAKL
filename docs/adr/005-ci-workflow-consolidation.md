# ADR-005: CI/CD Workflow Consolidation

## Status
Accepted

## Context
The repository had 11 separate GitHub Actions workflows, each running a single tool:
- checkov-iac-scan, code-quality, dependency-review, grype-security-scan, kics-security-scan, osv-scanner, retirejs, semgrep-sast, syft-sbom, trivy-security-scan, trufflehog-secret-scan

This caused:
- Excessive CI minutes (each workflow spins up a separate runner)
- Difficult to track which scans ran and in what order
- Redundant checkout/setup steps across workflows
- Noisy PR checks with 11 separate status checks

## Decision
Consolidate into 5 logical workflows:
1. **ci.yml** — typecheck, lint, unit tests (essential dev pipeline)
2. **code-quality.yml** — knip, jscpd, ast-grep (code health metrics)
3. **sast-scan.yml** — semgrep, trufflehog, checkov, kics (static analysis & secrets)
4. **vuln-scan.yml** — trivy, grype (dependency vulnerability scanning)
5. **dependency-scan.yml** — osv-scanner, retirejs, dependency-review, syft SBOM

Each workflow runs related tools as separate jobs within a single workflow file.

## Consequences
- **Positive**: 54% reduction in workflow files (11 → 5).
- **Positive**: Fewer runner spin-ups — related tools share a workflow.
- **Positive**: Easier to review and maintain — grouped by concern.
- **Positive**: Cleaner PR status checks (5 instead of 11).
- **Negative**: Slightly longer individual workflow files.
- **Negative**: All jobs in a workflow share the same trigger config (acceptable since they were already identical).

## Implementation
- `.github/workflows/ci.yml` — new
- `.github/workflows/code-quality.yml` — unchanged
- `.github/workflows/sast-scan.yml` — new (replaces 4 files)
- `.github/workflows/vuln-scan.yml` — new (replaces 2 files)
- `.github/workflows/dependency-scan.yml` — new (replaces 4 files)
