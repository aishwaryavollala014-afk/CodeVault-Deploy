import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const TAG_BYTES = 16;

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  
  // In development, if ENCRYPTION_KEY is missing, generate a dummy one so the app boots.
  // In production, this should throw if missing, but env.ts already validates it.
  const keyHex = env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
  const key = Buffer.from(keyHex, 'hex');
  
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }
  
  cachedKey = key;
  return cachedKey;
}

export function encryptToken(token: string): { cipher: Buffer; iv: Buffer } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  
  let encrypted = cipher.update(token, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final(), cipher.getAuthTag()]);
  
  return { cipher: encrypted, iv };
}

export function decryptToken(cipherBuffer: Buffer, iv: Buffer): string {
  const tag = cipherBuffer.subarray(cipherBuffer.length - TAG_BYTES);
  const data = cipherBuffer.subarray(0, cipherBuffer.length - TAG_BYTES);

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);

  const out = Buffer.concat([decipher.update(data), decipher.final()]);
  return out.toString('utf8');
}
