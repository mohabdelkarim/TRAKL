import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mergeTransactionsById } from '@/src/application/hooks/useTransactionSync';
import type { Transaction } from '@/src/domain/types';
import { useTrakl } from '@/src/application/store';

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

describe('financeSlice single-writer', () => {
  it('does not import secureStorage (sync is sole vault writer)', () => {
    const src = readFileSync(
      join(__dirname, '../src/application/store/slices/financeSlice.ts'),
      'utf8',
    );
    expect(src).not.toMatch(/secureStorage/);
  });
});

describe('transactionsPersistError', () => {
  beforeEach(() => {
    useTrakl.setState({ transactionsPersistError: null });
  });
  afterEach(() => {
    useTrakl.setState({ transactionsPersistError: null });
  });

  it('clearTransactionsPersistError resets the flag', () => {
    useTrakl.setState({ transactionsPersistError: 'Failed to save transactions securely.' });
    useTrakl.getState().clearTransactionsPersistError();
    expect(useTrakl.getState().transactionsPersistError).toBeNull();
  });
});
