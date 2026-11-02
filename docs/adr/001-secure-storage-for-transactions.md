# ADR-001: Secure Storage for Financial Transactions

## Status
Accepted (superseded storage medium 2026-11-02)

## Context
TRAKL tracks financial transactions as part of its Finance tracker. The app uses Zustand with `persist` middleware backed by AsyncStorage for state persistence. AsyncStorage stores data in plaintext on device.

Financial transaction data (amounts, merchants, categories) is sensitive. Storing it in plaintext poses a security risk if the device is compromised or backup data is extracted.

The original approach stored the full JSON blob in a single `expo-secure-store` value. Some iOS SecureStore implementations refuse values above roughly 2KB, and swallowed write errors caused silent data loss and false backup restore success.

## Decision
Exclude `transactions` from the Zustand `partialize` function so they are never written to AsyncStorage.

Store transactions in an AES-GCM encrypted file (`expo-file-system` document directory) with the encryption key held in SecureStore (Keychain/Keystore). On web, use WebCrypto AES-GCM with ciphertext (and key) in localStorage. Legacy plaintext SecureStore/localStorage values are migrated once into the vault.

The store keeps transactions in memory for UI rendering. A `useTransactionSync` hook synchronizes transactions to the vault whenever they change, and restores them on app launch. Save failures throw so backup import can report failure.

## Consequences
- **Positive**: Financial data is encrypted at rest; payload size is not limited by SecureStore value caps.
- **Positive**: Write errors propagate; backup restore no longer reports success after a failed save.
- **Negative**: Web key material in localStorage is weaker than native Keychain (disclose in privacy policy).
- **Negative**: Additional complexity in the vault module and sync hook.

## Implementation
- `src/infrastructure/storage/transaction_vault.ts` — AES-GCM encrypt/decrypt, file/localStorage I/O, legacy migration
- `src/infrastructure/storage/secureStorage.ts` — thin wrapper used by store/hooks
- `src/application/hooks/useTransactionSync.ts` — sync hook
- `src/application/store.ts` — `partialize` excludes `transactions`
- `__tests__/transaction_vault.test.ts` — round-trip, legacy migration, large payload
- `__tests__/security.test.ts` — verifies partialize exclusion and secure storage calls
