import { useEffect, useRef } from 'react';
import {
  getTransactionsSecure,
  saveTransactionsSecure,
} from '@/src/infrastructure/storage/secureStorage';
import { useTrakl } from '@/src/application/store';
import type { Transaction } from '@/src/domain/types';

/** Merge vault and in-memory transactions by id (memory wins on conflict). */
export function mergeTransactionsById(
  secure: Transaction[],
  current: Transaction[],
): Transaction[] {
  const byId = new Map<string, Transaction>();
  for (const tx of secure) byId.set(tx.id, tx);
  for (const tx of current) byId.set(tx.id, tx);
  return [...byId.values()];
}

/**
 * Syncs transactions to encrypted secure storage whenever they change.
 * Runs after the store has hydrated to avoid overwriting persisted data.
 * This is the single writer for the vault (financeSlice only mutates memory).
 */
export function useTransactionSync(): void {
  const hydrated = useTrakl((s) => s.hydrated);
  const transactions = useTrakl((s) => s.transactions);
  const restoredRef = useRef(false);

  useEffect(() => {
    if (!hydrated) return;
    void getTransactionsSecure()
      .then((secure) => {
        if (secure && secure.length > 0) {
          const current = useTrakl.getState().transactions;
          const merged = mergeTransactionsById(secure, current);
          useTrakl.setState({ transactions: merged, transactionsHydrated: true });
        } else {
          useTrakl.setState({ transactionsHydrated: true });
        }
        restoredRef.current = true;
      })
      .catch(() => {
        useTrakl.setState({
          transactionsHydrated: true,
          transactionsPersistError: 'Failed to load transactions from secure storage.',
        });
        restoredRef.current = true;
      });
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || !restoredRef.current) return;
    void saveTransactionsSecure(transactions)
      .then(() => {
        if (useTrakl.getState().transactionsPersistError) {
          useTrakl.setState({ transactionsPersistError: null });
        }
      })
      .catch((error) => {
        if (__DEV__) console.warn('[TransactionSync] save failed:', error);
        useTrakl.setState({
          transactionsPersistError: 'Failed to save transactions securely.',
        });
      });
  }, [hydrated, transactions]);
}
