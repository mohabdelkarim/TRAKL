/**
 * Generate a cryptographically secure unique ID.
 *
 * Uses `crypto.randomUUID()` when available (web, modern React Native),
 * falls back to a UUID v4 formatted from `crypto.getRandomValues`,
 * and as a last resort uses timestamp + Math.random.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    // Set version (4) and variant (10xx) bits per RFC 4122.
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
  }

  // Last resort: timestamp + Math.random (less secure but always available)
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
