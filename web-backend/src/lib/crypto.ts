import crypto from 'node:crypto';
import { env } from '../config/env';

/**
 * Envelope encryption for crown-jewel secrets (platform/GitHub tokens).
 * AES-256-GCM with a random 12-byte IV per value; the 16-byte auth tag is
 * appended to the ciphertext. Key comes from ENCRYPTION_KEY ("base64:<32 bytes>").
 * In prod the key lives in KMS; here it's an env secret. See SECURITY_PLAN §5.
 */
const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;

function loadKey(): Buffer {
  const raw = env.ENCRYPTION_KEY.startsWith('base64:')
    ? env.ENCRYPTION_KEY.slice('base64:'.length)
    : env.ENCRYPTION_KEY;
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must decode to exactly 32 bytes (AES-256).');
  }
  return key;
}

const KEY = loadKey();

export interface EncryptedBlob {
  /** ciphertext || authTag */
  cipher: Buffer;
  iv: Buffer;
}

export function encrypt(plaintext: string): EncryptedBlob {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { cipher: Buffer.concat([encrypted, tag]), iv };
}

export function decrypt(cipher: Buffer, iv: Buffer): string {
  const data = cipher.subarray(0, cipher.length - TAG_BYTES);
  const tag = cipher.subarray(cipher.length - TAG_BYTES);
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

/** SHA-256 hash (hex) — for storing refresh tokens without keeping the plaintext. */
export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/** Cryptographically-random URL-safe token. */
export function randomToken(bytes = 40): string {
  return crypto.randomBytes(bytes).toString('base64url');
}
