# Local CI dry-run wrapper.
# Sets secrets from a local file (gitignored) and invokes local-dry-run.ps1.
# Usage: powershell -File scripts\run-dry-run.ps1
# Or just run scripts\local-dry-run.ps1 directly with -StorePassword.

$ErrorActionPreference = "Stop"

# Read from environment or prompt — never hard-code secrets.
$env:ANDROID_KEYSTORE_PASSWORD = $env:ANDROID_KEYSTORE_PASSWORD ?? (Read-Host "Enter ANDROID_KEYSTORE_PASSWORD")
$env:ANDROID_KEY_ALIAS         = "upload"
$env:ANDROID_KEY_PASSWORD      = $env:ANDROID_KEYSTORE_PASSWORD

& (Join-Path $PSScriptRoot "local-dry-run.ps1") `
    -StorePassword $env:ANDROID_KEYSTORE_PASSWORD `
    -KeyAlias      $env:ANDROID_KEY_ALIAS `
    -KeyPassword   $env:ANDROID_KEY_PASSWORD
