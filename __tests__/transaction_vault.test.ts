import { describe, it, expect, beforeEach } from '@jest/globals';
import { Platform } from 'react-native';
import type { Transaction } from '@/src/domain/types';
import {
  saveTransactionsVault,
  getTransactionsVault,
  deleteTransactionsVault,
} from '@/src/infrastructure/storage/transaction_vault';
import { saveTransactionsSecure } from '@/src/infrastructure/storage/secureStorage';

const memoryStore = new Map<string, string>();

const sample: Transaction[] = [
  {
    id: 'tx1',
    kind: 'expense',
    merchant: 'Cafe',
    category: 'Food',
    amount: 12.5,
    date: '2026-11-02',
  },
];

describe('transaction vault', () => {
  beforeEach(async () => {
    memoryStore.clear();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => memoryStore.get(key) ?? null,
        setItem: (key: string, value: string) => {
          memoryStore.set(key, value);
        },
        removeItem: (key: string) => {
          memoryStore.delete(key);
        },
        clear: () => memoryStore.clear(),
      },
    });
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'web' });
    await deleteTransactionsVault();
  });

  it('round-trips encrypted transactions on web', async () => {
    await saveTransactionsVault(sample);
    const cipher = localStorage.getItem('trakl_tx_vault_cipher_v1');
    expect(cipher).toBeTruthy();
    expect(cipher).toMatch(/^trakl1\./);
    expect(cipher).not.toContain('Cafe');

    const loaded = await getTransactionsVault();
    expect(loaded).toEqual(sample);
  });

  it('propagates save failures from secureStorage wrapper', async () => {
    const originalSetItem = localStorage.setItem.bind(localStorage);
    Object.defineProperty(localStorage, 'setItem', {
      configurable: true,
      value: () => {
        throw new Error('disk full');
      },
    });
    try {
      await expect(saveTransactionsSecure(sample)).rejects.toThrow('disk full');
    } finally {
      Object.defineProperty(localStorage, 'setItem', {
        configurable: true,
        value: originalSetItem,
      });
    }
  });

  it('migrates legacy plaintext localStorage into the vault', async () => {
    localStorage.setItem('trakl-transactions-secure', JSON.stringify(sample));
    const loaded = await getTransactionsVault();
    expect(loaded).toEqual(sample);
    expect(localStorage.getItem('trakl-transactions-secure')).toBeNull();
    expect(localStorage.getItem('trakl_tx_vault_cipher_v1')).toMatch(/^trakl1\./);
  });

  it('stores large histories without SecureStore size limit', async () => {
    const large: Transaction[] = Array.from({ length: 500 }, (_, i) => ({
      id: `tx-${i}`,
      kind: 'expense' as const,
      merchant: `Merchant ${i}`,
      category: 'Food',
      amount: i + 0.99,
      date: '2026-01-01',
    }));
    const jsonSize = JSON.stringify(large).length;
    expect(jsonSize).toBeGreaterThan(2048);

    await saveTransactionsVault(large);
    const loaded = await getTransactionsVault();
    expect(loaded).toHaveLength(500);
  });

  it('round-trips when global crypto is missing (Hermes / Expo Go)', async () => {
    const previous = globalThis.crypto;
    // oxlint-disable-next-line typescript/no-explicit-any
    delete (globalThis as { crypto?: Crypto }).crypto;
    try {
      await saveTransactionsVault(sample);
      const loaded = await getTransactionsVault();
      expect(loaded).toEqual(sample);
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        configurable: true,
        value: previous,
      });
    }
  });
});
