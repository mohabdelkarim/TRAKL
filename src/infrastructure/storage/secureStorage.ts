import type { Transaction } from '@/src/domain/types';
import {
  deleteTransactionsVault,
  getTransactionsVault,
  saveTransactionsVault,
} from '@/src/infrastructure/storage/transaction_vault';

/**
 * Encrypted storage for sensitive financial data (transactions).
 * Native: AES-GCM file in documentDirectory, key in SecureStore.
 * Web: AES-GCM ciphertext in localStorage (key also local — weaker than native).
 * Throws on save failure so callers can surface errors.
 */

export async function saveTransactionsSecure(transactions: Transaction[]): Promise<void> {
  await saveTransactionsVault(transactions);
}

export async function getTransactionsSecure(): Promise<Transaction[] | null> {
  return getTransactionsVault();
}

export async function deleteTransactionsSecure(): Promise<void> {
  await deleteTransactionsVault();
}
