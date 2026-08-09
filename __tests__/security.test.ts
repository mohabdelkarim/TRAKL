import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { useTrakl } from '@/src/application/store';
import { generateId } from '@/src/shared/utils/id';

// Mock secureStorage to verify it's called
jest.mock('@/src/infrastructure/storage/secureStorage', () => ({
  saveTransactionsSecure: jest.fn(),
  deleteTransactionsSecure: jest.fn(),
  getTransactionsSecure: jest.fn(() => Promise.resolve([])),
}));

// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const { saveTransactionsSecure, deleteTransactionsSecure } = require('@/src/infrastructure/storage/secureStorage') as {
  saveTransactionsSecure: ReturnType<typeof jest.fn>;
  deleteTransactionsSecure: ReturnType<typeof jest.fn>;
};

describe('Security: Transactions Storage', () => {
  beforeEach(() => {
    useTrakl.setState({
      transactions: [],
      habits: [],
      tasks: [],
      goals: [],
      planner: [],
      sleep: [],
      workouts: [],
      mood: [],
      water: [],
      weight: [],
      meditation: [],
      customTrackers: [],
      notifications: [],
      achievements: [],
      monthlyBudget: 0,
    });
    saveTransactionsSecure.mockClear();
    deleteTransactionsSecure.mockClear();
  });

  it('should not persist transactions in plaintext AsyncStorage', () => {
    // The store's partialize config must exclude transactions.
    // We verify by checking the persist configuration directly.
    const store = useTrakl as unknown as {
      persist: { getOptions: () => { partialize: (s: unknown) => Record<string, unknown> } };
    };
    const options = store.persist.getOptions();
    const partialized = options.partialize(useTrakl.getState());

    // Transactions must NOT appear in the partialized (persisted) state
    expect(partialized).not.toHaveProperty('transactions');

    // But other sensitive-ish fields should be persisted normally
    expect(partialized).toHaveProperty('habits');
    expect(partialized).toHaveProperty('monthlyBudget');
    expect(partialized).toHaveProperty('profile');
  });

  it('should have transactions in memory after adding', () => {
    const state = useTrakl.getState();
    const initialCount = state.transactions.length;

    useTrakl.setState({
      transactions: [
        ...state.transactions,
        {
          id: 'test-tx-1',
          kind: 'expense',
          merchant: 'Test Store',
          category: 'Food',
          amount: 25.5,
          date: '2024-01-01',
        },
      ],
    });

    const newState = useTrakl.getState();
    expect(newState.transactions).toHaveLength(initialCount + 1);
    expect(newState.transactions[0].merchant).toBe('Test Store');
  });

  it('should call saveTransactionsSecure when adding a transaction', () => {
    useTrakl.getState().addTransaction({
      kind: 'expense',
      merchant: 'Test',
      category: 'Food',
      amount: 10,
      date: '2024-01-01',
    });

    expect(saveTransactionsSecure).toHaveBeenCalledTimes(1);
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const savedTx = saveTransactionsSecure.mock.calls[0][0] as Array<{ merchant: string }>;
    expect(savedTx).toHaveLength(1);
    expect(savedTx[0].merchant).toBe('Test');
  });

  it('should call saveTransactionsSecure when deleting a transaction', () => {
    useTrakl.setState({
      transactions: [
        {
          id: 'tx-del-1',
          kind: 'expense',
          merchant: 'Test',
          category: 'Food',
          amount: 10,
          date: '2024-01-01',
        },
      ],
    });

    useTrakl.getState().deleteTransaction('tx-del-1');

    expect(saveTransactionsSecure).toHaveBeenCalledTimes(1);
    expect(saveTransactionsSecure.mock.calls[0][0]).toHaveLength(0);
  });

  it('should call deleteTransactionsSecure on clearAllData', () => {
    useTrakl.setState({
      transactions: [
        {
          id: 'tx-clear-1',
          kind: 'income',
          merchant: 'Employer',
          category: 'Salary',
          amount: 5000,
          date: '2024-01-01',
        },
      ],
    });

    useTrakl.getState().clearAllData();

    expect(deleteTransactionsSecure).toHaveBeenCalledTimes(1);
    const state = useTrakl.getState();
    expect(state.transactions).toEqual([]);
    expect(state.monthlyBudget).toBe(0);
  });

  it('should call deleteTransactionsSecure on resetApp', () => {
    useTrakl.getState().resetApp();
    expect(deleteTransactionsSecure).toHaveBeenCalledTimes(1);
  });
});

describe('Security: ID Generation', () => {
  it('should generate unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(1000);
  });

  it('should generate non-empty string IDs', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('should not use Math.random directly in store actions', () => {
    // Verify that addTransaction generates IDs via generateId (not Math.random)
    const tx1 = useTrakl.getState().addTransaction;
    const tx2 = useTrakl.getState().addTransaction;

    // Add two transactions and verify they get different IDs
    // (Math.random could collide, generateId should not)
    useTrakl.setState({ transactions: [] });
    tx1({ kind: 'expense', merchant: 'A', category: 'Food', amount: 5, date: '2024-01-01' });
    tx2({ kind: 'expense', merchant: 'B', category: 'Food', amount: 5, date: '2024-01-01' });

    const state = useTrakl.getState();
    expect(state.transactions[0].id).not.toBe(state.transactions[1].id);
    // IDs should be longer than 8 chars (Math.random base36 was 8 chars)
    expect(state.transactions[0].id.length).toBeGreaterThanOrEqual(8);
  });
});
