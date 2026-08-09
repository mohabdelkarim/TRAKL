# ADR-001: Secure Storage for Financial Transactions

## Status
Accepted

## Context
TRAKL tracks financial transactions as part of its Finance tracker. The app uses Zustand with `persist` middleware backed by AsyncStorage for state persistence. AsyncStorage stores data in plaintext on device.

Financial transaction data (amounts, merchants, categories) is sensitive. Storing it in plaintext poses a security risk if the device is compromised or backup data is extracted.

## Decision
Exclude `transactions` from the Zustand `partialize` function so they are never written to AsyncStorage. Instead, store transactions in `expo-secure-store` (Keychain on iOS, Keystore on Android) via the `secureStorage.ts` module.

The store keeps transactions in memory for UI rendering. A `useTransactionSync` hook synchronizes transactions to secure storage whenever they change, and restores them on app launch.

## Consequences
- **Positive**: Financial data is encrypted at rest using platform-native secure storage.
- **Positive**: No changes to UI code — transactions are transparently available in store state.
- **Negative**: Secure storage has size limits (~2KB per key on some platforms). Large transaction lists may need pagination or chunking in the future.
- **Negative**: Additional complexity in the sync hook and secure storage module.

## Implementation
- `src/infrastructure/storage/secureStorage.ts` — encrypted read/write/delete
- `src/application/hooks/useTransactionSync.ts` — sync hook
- `src/application/store.ts` — `partialize` excludes `transactions`
- `__tests__/security.test.ts` — verifies partialize exclusion and secure storage calls
- `__tests__/persistence.test.ts` — verifies partialize config
