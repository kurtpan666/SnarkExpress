import * as secp256k1 from '@noble/secp256k1';
import { createHash, randomBytes } from 'crypto';

/**
 * Generate a new key pair using secp256k1 (same as Bitcoin)
 * @returns An object containing privateKey and publicKey in hex format
 */
export function generateKeyPair(): { privateKey: string; publicKey: string } {
  // Generate a random 32-byte private key
  const privateKeyBytes = randomBytes(32);
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
 * Sign a message with a private key
 * @param message - The message to sign
 * @param privateKeyHex - The private key in hex format
 * @returns The signature in hex format
 */
export async function signMessage(
  message: string,
  privateKeyHex: string
): Promise<string> {
  try {
    // Hash the message with SHA-256
    const messageHash = createHash('sha256').update(message).digest();

    // Sign the hash
    const privateKeyBytes = Buffer.from(privateKeyHex, 'hex');
    const signature = await secp256k1.sign(messageHash, privateKeyBytes);

    // Return signature in hex format
    return Buffer.from(signature).toString('hex');
  } catch (error) {
    throw new Error(`Failed to sign message: ${error}`);
  }
}

/**
 * Verify a signature against a message and public key
 * @param message - The original message
 * @param signatureHex - The signature in hex format
 * @param publicKeyHex - The public key in hex format
 * @returns True if signature is valid, false otherwise
 */
export async function verifySignature(
  message: string,
  signatureHex: string,
  publicKeyHex: string
): Promise<boolean> {
  try {
    // Hash the message with SHA-256
    const messageHash = createHash('sha256').update(message).digest();

    // Verify the signature
    const signature = Buffer.from(signatureHex, 'hex');
    const publicKey = Buffer.from(publicKeyHex, 'hex');

    return await secp256k1.verify(signature, messageHash, publicKey);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Derive public key from private key
 * @param privateKeyHex - The private key in hex format
 * @returns The public key in hex format
 */
export function getPublicKeyFromPrivate(privateKeyHex: string): string {
  try {
    const privateKeyBytes = Buffer.from(privateKeyHex, 'hex');
    const publicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, true);
    return Buffer.from(publicKeyBytes).toString('hex');
  } catch (error) {
    throw new Error(`Failed to derive public key: ${error}`);
  }
}

/**
 * Validate a private key
 * @param privateKeyHex - The private key in hex format
 * @returns True if valid, false otherwise
 */
export function isValidPrivateKey(privateKeyHex: string): boolean {
  try {
    if (!privateKeyHex || privateKeyHex.length !== 64) {
      return false;
    }
    const privateKeyBytes = Buffer.from(privateKeyHex, 'hex');
    if (privateKeyBytes.length !== 32) {
      return false;
    }
    // Try to derive public key - if this fails, the private key is invalid
    secp256k1.getPublicKey(privateKeyBytes, true);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a public key
 * @param publicKeyHex - The public key in hex format
 * @returns True if valid, false otherwise
 */
export function isValidPublicKey(publicKeyHex: string): boolean {
  try {
    if (!publicKeyHex || (publicKeyHex.length !== 66 && publicKeyHex.length !== 130)) {
      return false;
    }
    // Try to parse the public key - fromHex accepts hex string
    secp256k1.Point.fromHex(publicKeyHex);
    return true;
  } catch {
    return false;
  }
}
