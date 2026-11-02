import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react-native';
import { useTrakl } from '@/src/application/store';
import { createBackup } from '@/src/application/backup';

jest.mock('@/src/infrastructure/storage/secureStorage', () => ({
  saveTransactionsSecure: jest.fn(),
  deleteTransactionsSecure: jest.fn(() => Promise.resolve()),
  getTransactionsSecure: jest.fn(() => Promise.resolve([])),
}));

// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const { saveTransactionsSecure } = require('@/src/infrastructure/storage/secureStorage') as {
  saveTransactionsSecure: jest.Mock;
};

describe('backup import vault errors', () => {
  beforeEach(() => {
    useTrakl.setState({
      transactions: [],
      habits: [],
      profile: {
        name: 'Original',
        avatarEmoji: '🦊',
        memberSince: '2024-01-01',
      },
      monthlyBudget: 100,
    } as never);
    saveTransactionsSecure.mockReset();
  });

  it('reports failure when vault save rejects and does not overwrite state', async () => {
    saveTransactionsSecure.mockImplementation(() => Promise.reject(new Error('vault write failed')));
    const { result } = renderHook(() => useTrakl());
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const backup = createBackup({
      ...result.current,
      profile: { ...result.current.profile, name: 'Hacker' },
      monthlyBudget: 9999,
      transactions: [
        {
          id: 'tx-bad',
          kind: 'expense',
          merchant: 'Nope',
          category: 'Food',
          amount: 1,
          date: '2026-01-01',
        },
      ],
    } as unknown as Parameters<typeof createBackup>[0]);

    let res = { success: true, message: '' };
    await act(async () => {
      res = await result.current.importAppData(backup);
    });

    expect(res.success).toBe(false);
    expect(res.message).toMatch(/Failed to save transactions securely/);
    expect(result.current.profile.name).toBe('Original');
    expect(result.current.monthlyBudget).toBe(100);
  });
});
