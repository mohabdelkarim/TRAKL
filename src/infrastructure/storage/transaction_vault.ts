import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import { getRandomBytes } from 'expo-crypto';
import { gcm } from '@noble/ciphers/aes';
import { Platform } from 'react-native';
import type { Transaction } from '@/src/domain/types';

const LEGACY_TRANSACTIONS_KEY = 'trakl-transactions-secure';
const VAULT_KEY_ID = 'trakl_tx_vault_key_v1';
const WEB_CIPHER_KEY = 'trakl_tx_vault_cipher_v1';
const WEB_KEY_STORAGE = 'trakl_tx_vault_key_v1';
const FILE_NAME = 'trakl_transactions_vault_v1.enc';
const PREFIX = 'trakl1.';

/** Hermes has no global `crypto`; use globalThis + expo-crypto fallback. */
function randomBytes(byteLength: number): Uint8Array {
  const webCrypto = globalThis.crypto;
  if (webCrypto && typeof webCrypto.getRandomValues === 'function') {
    return webCrypto.getRandomValues(new Uint8Array(byteLength));
  }
  return getRandomBytes(byteLength);
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(value, 'base64'));
  }
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function loadOrCreateRawKey(): Promise<Uint8Array> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') {
      throw new Error('localStorage unavailable');
    }
    const existing = localStorage.getItem(WEB_KEY_STORAGE);
    if (existing) return base64ToBytes(existing);
    const raw = randomBytes(32);
    localStorage.setItem(WEB_KEY_STORAGE, bytesToBase64(raw));
    return raw;
  }

  const existing = await SecureStore.getItemAsync(VAULT_KEY_ID);
  if (existing) return base64ToBytes(existing);
  const raw = randomBytes(32);
  await SecureStore.setItemAsync(VAULT_KEY_ID, bytesToBase64(raw));
  return raw;
}

async function encryptJson(json: string): Promise<string> {
  const rawKey = await loadOrCreateRawKey();
  const iv = randomBytes(12);
  const encoded = new TextEncoder().encode(json);
  // Pure-JS AES-GCM (same wire format as WebCrypto: ciphertext || tag)
  const cipher = gcm(rawKey, iv).encrypt(encoded);
  const packed = new Uint8Array(iv.length + cipher.length);
  packed.set(iv, 0);
  packed.set(cipher, iv.length);
  return PREFIX + bytesToBase64(packed);
}

async function decryptPayload(payload: string): Promise<string> {
  if (!payload.startsWith(PREFIX)) {
    throw new Error('Unrecognized vault payload');
  }
  const packed = base64ToBytes(payload.slice(PREFIX.length));
  if (packed.length < 13) throw new Error('Corrupt vault payload');
  const iv = packed.slice(0, 12);
  const cipher = packed.slice(12);
  const rawKey = await loadOrCreateRawKey();
  const plain = gcm(rawKey, iv).decrypt(cipher);
  return new TextDecoder().decode(plain);
}

function vaultFileUri(): string {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const docDir = (FileSystem as { documentDirectory?: string | null }).documentDirectory;
  if (!docDir) throw new Error('documentDirectory unavailable');
  return `${docDir}${FILE_NAME}`;
}

async function writeNativeCipher(payload: string): Promise<void> {
  const uri = vaultFileUri();
  await FileSystem.writeAsStringAsync(uri, payload, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  const readBack = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  if (readBack !== payload) {
    throw new Error('Vault write verification failed');
  }
}

async function readNativeCipher(): Promise<string | null> {
  const uri = vaultFileUri();
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) return null;
  return FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

async function deleteNativeCipher(): Promise<void> {
  const uri = vaultFileUri();
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
}

async function readLegacyPlaintext(): Promise<Transaction[] | null> {
  try {
    let json: string | null = null;
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        json = localStorage.getItem(LEGACY_TRANSACTIONS_KEY);
      }
    } else {
      json = await SecureStore.getItemAsync(LEGACY_TRANSACTIONS_KEY);
    }
    if (!json) return null;
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return null;
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return parsed as Transaction[];
  } catch {
    return null;
  }
}

async function deleteLegacyPlaintext(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(LEGACY_TRANSACTIONS_KEY);
      }
    } else {
      await SecureStore.deleteItemAsync(LEGACY_TRANSACTIONS_KEY);
    }
  } catch {
    // best-effort cleanup
  }
}

function parseTransactions(json: string): Transaction[] {
  const parsed = JSON.parse(json) as unknown;
  if (!Array.isArray(parsed)) throw new Error('Vault payload is not a transaction array');
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return parsed as Transaction[];
}

/** Persist transactions; throws on failure. Verifies native writes by read-back. */
export async function saveTransactionsVault(transactions: Transaction[]): Promise<void> {
  const json = JSON.stringify(transactions);
  const payload = await encryptJson(json);
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') throw new Error('localStorage unavailable');
    localStorage.setItem(WEB_CIPHER_KEY, payload);
    const readBack = localStorage.getItem(WEB_CIPHER_KEY);
    if (readBack !== payload) throw new Error('Vault write verification failed');
    return;
  }
  await writeNativeCipher(payload);
}

/** Load transactions from vault, migrating legacy SecureStore plaintext if needed. */
export async function getTransactionsVault(): Promise<Transaction[] | null> {
  try {
    let payload: string | null = null;
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        payload = localStorage.getItem(WEB_CIPHER_KEY);
      }
    } else {
      payload = await readNativeCipher();
    }

    if (payload) {
      const json = await decryptPayload(payload);
      return parseTransactions(json);
    }

    const legacy = await readLegacyPlaintext();
    if (!legacy) return null;
    await saveTransactionsVault(legacy);
    await deleteLegacyPlaintext();
    return legacy;
  } catch (error) {
    if (__DEV__) {
      console.warn('[TransactionVault] Failed to load:', error);
    }
    return null;
  }
}

export async function deleteTransactionsVault(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(WEB_CIPHER_KEY);
    }
  } else {
    await deleteNativeCipher();
  }
  await deleteLegacyPlaintext();
}
