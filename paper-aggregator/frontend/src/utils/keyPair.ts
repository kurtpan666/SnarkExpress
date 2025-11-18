import * as secp256k1 from '@noble/secp256k1';

/**
 * Convert Uint8Array to hex string (browser-compatible)
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to Uint8Array (browser-compatible)
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Generate a new key pair using secp256k1 (same as Bitcoin)
 */
export function generateKeyPair(): { privateKey: string; publicKey: string } {
  // Generate a random 32-byte private key
  const privateKeyBytes = secp256k1.utils.randomPrivateKey();
  const privateKey = bytesToHex(privateKeyBytes);

  // Derive public key from private key (compressed format)
  const publicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, true);
  const publicKey = bytesToHex(publicKeyBytes);

  return {
    privateKey,
    publicKey,
  };
}

/**
 * Derive public key from private key
 */
export function getPublicKeyFromPrivate(privateKeyHex: string): string {
  const privateKeyBytes = hexToBytes(privateKeyHex);
  const publicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, true);
  return bytesToHex(publicKeyBytes);
}
