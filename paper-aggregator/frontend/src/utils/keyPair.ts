import * as secp256k1 from '@noble/secp256k1';

/**
 * Generate a new key pair using secp256k1 (same as Bitcoin)
 */
export function generateKeyPair(): { privateKey: string; publicKey: string } {
  // Generate a random 32-byte private key
  const privateKeyBytes = secp256k1.utils.randomPrivateKey();
  const privateKey = Buffer.from(privateKeyBytes).toString('hex');

  // Derive public key from private key (compressed format)
  const publicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, true);
  const publicKey = Buffer.from(publicKeyBytes).toString('hex');

  return {
    privateKey,
    publicKey,
  };
}

/**
 * Derive public key from private key
 */
export function getPublicKeyFromPrivate(privateKeyHex: string): string {
  const privateKeyBytes = Buffer.from(privateKeyHex, 'hex');
  const publicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, true);
  return Buffer.from(publicKeyBytes).toString('hex');
}
