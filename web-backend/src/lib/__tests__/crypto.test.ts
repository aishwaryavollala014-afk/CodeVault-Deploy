import { describe, it, expect } from 'vitest';
import { encryptToken, decryptToken } from '../crypto';

describe('crypto utils', () => {
  it('should encrypt and decrypt a token successfully', () => {
    const secretText = 'my-super-secret-oauth-token-12345';
    const { cipher, iv } = encryptToken(secretText);
    
    expect(cipher).toBeDefined();
    expect(iv).toBeDefined();
    expect(cipher.length).toBeGreaterThan(0);
    
    // Ensure ciphertext does not contain plaintext
    expect(cipher.toString('utf8')).not.toContain(secretText);

    const decrypted = decryptToken(cipher, iv);
    expect(decrypted).toBe(secretText);
  });

  it('should produce different ciphertexts for the same plaintext due to random IV', () => {
    const secretText = 'test-token';
    const result1 = encryptToken(secretText);
    const result2 = encryptToken(secretText);

    expect(result1.iv).not.toEqual(result2.iv);
    expect(result1.cipher).not.toEqual(result2.cipher);
  });
});
