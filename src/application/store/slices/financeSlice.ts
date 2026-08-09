import type { StateCreator } from 'zustand';

import type { TraklState, FinanceSlice } from '../types';
import { generateId } from '@/src/shared/utils/id';
import { saveTransactionsSecure } from '@/src/infrastructure/storage/secureStorage';
import { MONTHLY_BUDGET } from '../types';

export const createFinanceSlice: StateCreator<TraklState, [], [], FinanceSlice> = (set) => ({
  transactions: [],
  monthlyBudget: MONTHLY_BUDGET,

  addTransaction: (tx) =>
    set((s) => {
      const amount = Math.min(10_000_000, Math.max(0.01, tx.amount || 0.01));
      const transactions = [{ ...tx, amount, id: generateId() }, ...s.transactions];
      void saveTransactionsSecure(transactions);
      return { transactions };
    }),

  deleteTransaction: (tid) =>
    set((s) => {
      const transactions = s.transactions.filter((t) => t.id !== tid);
      void saveTransactionsSecure(transactions);
      return { transactions };
    }),

  setMonthlyBudget: (budget) =>
    set({ monthlyBudget: Math.min(10_000_000, Math.max(0, Math.round(budget))) }),
});
