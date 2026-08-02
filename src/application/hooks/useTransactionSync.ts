import { useEffect, useRef } from 'react';
import {
  getTransactionsSecure,
  saveTransactionsSecure,
} from '@/src/infrastructure/storage/secureStorage';
import { useTrakl } from '@/src/application/store';

/**
 * Syncs transactions to encrypted secure storage whenever they change.
 * Runs after the store has hydrated to avoid overwriting persisted data.
 */
export function useTransactionSync(): void {
  const hydrated = useTrakl((s) => s.hydrated);
  const transactions = useTrakl((s) => s.transactions);
  const restoredRef = useRef(false);

  // On mount, restore transactions from secure storage if available
  useEffect(() => {
    if (!hydrated) return;
    void getTransactionsSecure().then((secure) => {
      if (secure && secure.length > 0) {
        const current = useTrakl.getState().transactions;
        if (current.length === 0) {
          useTrakl.setState({ transactions: secure });
        }
      }
      restoredRef.current = true;
    });
  }, [hydrated]);

  // Save transactions to secure storage whenever they change.
  // Wait until the restore pass has completed to avoid overwriting
  // secure data with empty in-memory state before it's been read.
  useEffect(() => {
    if (!hydrated || !restoredRef.current) return;
    void saveTransactionsSecure(transactions);
  }, [hydrated, transactions]);
}
