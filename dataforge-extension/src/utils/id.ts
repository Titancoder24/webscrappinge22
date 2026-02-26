/**
 * Lightweight ID generation utility.
 * Produces URL-safe, unique identifiers without external dependencies.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
const ALPHABET_LEN = ALPHABET.length;

/**
 * Generate a cryptographically random ID string.
 *
 * @param length - Length of the generated ID (default 21, matching nanoid default)
 * @returns A URL-safe random string
 */
export function generateId(length: number = 21): string {
  // Use crypto.getRandomValues for cryptographic randomness when available
  // (available in both browser and service-worker contexts)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    let id = '';
    for (let i = 0; i < length; i++) {
      id += ALPHABET[bytes[i] & 63]; // Mask to 6 bits → 0-63 index
    }
    return id;
  }

  // Fallback for environments without crypto (should not happen in Chrome extensions)
  let id = '';
  for (let i = 0; i < length; i++) {
    id += ALPHABET[Math.floor(Math.random() * ALPHABET_LEN)];
  }
  return id;
}

/**
 * Generate a prefixed ID for easier debugging/logging.
 *
 * @param prefix - String prefix (e.g. 'tbl', 'row', 'tmpl')
 * @param length - Length of the random part (default 12)
 * @returns A prefixed ID like "tbl_aBcDeFgHiJkL"
 */
export function generatePrefixedId(prefix: string, length: number = 12): string {
  return `${prefix}_${generateId(length)}`;
}
