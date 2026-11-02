import { describe, it, expect } from '@jest/globals';
import { mergeTransactionsById } from '@/src/application/hooks/useTransactionSync';
import type { Transaction } from '@/src/domain/types';

const tx = (id: string, merchant: string): Transaction => ({
  id,
  kind: 'expense',
  merchant,
  category: 'Food',
  amount: 1,
  date: '2026-01-01',
});

describe('mergeTransactionsById', () => {
  it('keeps vault rows and prefers in-memory on id conflict', () => {
    const secure = [tx('a', 'Vault'), tx('b', 'OnlyVault')];
    const current = [tx('a', 'Memory'), tx('c', 'OnlyMemory')];
    const merged = mergeTransactionsById(secure, current);
    const byId = Object.fromEntries(merged.map((t) => [t.id, t.merchant]));
    expect(byId.a).toBe('Memory');
    expect(byId.b).toBe('OnlyVault');
    expect(byId.c).toBe('OnlyMemory');
    expect(merged).toHaveLength(3);
  });
});
