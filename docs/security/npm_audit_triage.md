# npm audit triage (2026-11-02)

After bumping `posthog-js` and running `npm audit fix` (no `--force`):

- Remaining issues are mostly **dev tooling** (eslint-plugin-react-compiler → zod, oxfmt → tinypool, js-yaml, shell-quote) or **build-time** transitive deps (e.g. `node-forge` via `expo-updates`).
- Critical/high runtime path for the shipped web bundle: re-check `posthog-js` / `dompurify` after each bump.
- Do not run `npm audit fix --force` without reviewing breaking peer changes (eslint-plugin-react-compiler).

`npm ci` succeeds with the committed lockfile after this remediation pass.
