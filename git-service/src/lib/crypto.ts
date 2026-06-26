import crypto from 'node:crypto';
import { env } from '../config/env';

/**
 * Decrypts the platform/GitHub tokens that web-backend encrypted. Uses the SAME
 * AES-256-GCM scheme + ENCRYPTION_KEY. Decrypted tokens live in memory only,
 * are never logged, and should be discarded as soon as the sync finishes.
 */
const ALGORITHM = 'aes-256-gcm';
const TAG_BYTES = 16;

function loadKey(): Buffer {
  const raw = env.ENCRYPTION_KEY.startsWith('base64:')
    ? env.ENCRYPTION_KEY.slice('base64:'.length)
    : env.ENCRYPTION_KEY;
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('ENCRYPTION_KEY must decode to 32 bytes.');
  return key;
}

const KEY = loadKey();

export function decrypt(cipher: Buffer, iv: Buffer): string {
  const data = cipher.subarray(0, cipher.length - TAG_BYTES);
  const tag = cipher.subarray(cipher.length - TAG_BYTES);
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
