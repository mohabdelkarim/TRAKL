import type { StateCreator } from 'zustand';

import type { TraklState, FinanceSlice } from '../types';
import { generateId } from '@/src/shared/utils/id';
import { MONTHLY_BUDGET } from '../types';

export const createFinanceSlice: StateCreator<TraklState, [], [], FinanceSlice> = (set) => ({
  transactions: [],
  monthlyBudget: MONTHLY_BUDGET,
  transactionsPersistError: null,

  addTransaction: (tx) =>
    set((s) => {
      const amount = Math.min(10_000_000, Math.max(0.01, tx.amount || 0.01));
      const transactions = [{ ...tx, amount, id: generateId() }, ...s.transactions];
      return { transactions };
    }),

  deleteTransaction: (tid) =>
    set((s) => {
      const transactions = s.transactions.filter((t) => t.id !== tid);
      return { transactions };
    }),

  setMonthlyBudget: (budget) =>
    set((s) => {
      const next = Math.min(10_000_000, Math.max(0, Math.round(budget)));
      return s.monthlyBudget === next ? s : { monthlyBudget: next };
    }),

  clearTransactionsPersistError: () => set({ transactionsPersistError: null }),
});
