import crypto from 'node:crypto';
import { env } from '../config/env';

// Mirrors web-backend's token encryption (auth.service.ts):
//   key = Buffer.from(ENCRYPTION_KEY, 'hex')   (64 hex chars = 32 bytes)
//   iv  = 12 random bytes (stored as tokenIv)
//   stored cipher = ciphertext || authTag      (GCM auth tag appended, 16 bytes)
// git-service only ever DECRYPTS (web-backend owns encryption).
const ALGORITHM = 'aes-256-gcm';
const TAG_BYTES = 16;

let cachedKey: Buffer | null = null;

// Loaded lazily (on first decrypt) so an invalid/placeholder key never blocks boot —
// only an actual sync that needs to decrypt will fail, with a clear error.
function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const key = Buffer.from(env.ENCRYPTION_KEY, 'hex');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes) — must match web-backend');
  }
  cachedKey = key;
  return cachedKey;
}

// Decrypt a stored token. `cipher` = accessTokenCipher/tokenCipher, `iv` = tokenIv (both Bytes).
export function decrypt(cipher: Buffer, iv: Buffer): string {
  const tag = cipher.subarray(cipher.length - TAG_BYTES);
  const data = cipher.subarray(0, cipher.length - TAG_BYTES);

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);

  const out = Buffer.concat([decipher.update(data), decipher.final()]);
  return out.toString('utf8');
}
