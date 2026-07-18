import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { decrypt } from '../src/lib/crypto';

// Uses the same ENCRYPTION_KEY the module reads (set in vitest.config.ts),
// so the test encrypts exactly the way web-backend does and git-service decrypts.
const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

function encrypt(plain: string, iv: Buffer): Buffer {
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return Buffer.concat([enc, c.getAuthTag()]); // ciphertext || 16-byte tag
}

describe('decrypt (AES-256-GCM — mirrors web-backend token encryption)', () => {
  it('round-trips a token produced with the same key + iv', () => {
    const iv = crypto.randomBytes(12);
    const cipher = encrypt('gho_secretGithubToken123', iv);
    expect(decrypt(cipher, iv)).toBe('gho_secretGithubToken123');
  });

  it('handles empty and unicode plaintext', () => {
    const iv = crypto.randomBytes(12);
    expect(decrypt(encrypt('', iv), iv)).toBe('');
    const iv2 = crypto.randomBytes(12);
    expect(decrypt(encrypt('café — 日本語', iv2), iv2)).toBe('café — 日本語');
  });

  it('throws when the auth tag is tampered (integrity check)', () => {
    const iv = crypto.randomBytes(12);
    const cipher = encrypt('secret', iv);
    cipher[cipher.length - 1] ^= 0xff; // corrupt last tag byte
    expect(() => decrypt(cipher, iv)).toThrow();
  });

  it('throws when decrypted with the wrong iv', () => {
    const iv = crypto.randomBytes(12);
    const cipher = encrypt('secret', iv);
    expect(() => decrypt(cipher, crypto.randomBytes(12))).toThrow();
  });
});
