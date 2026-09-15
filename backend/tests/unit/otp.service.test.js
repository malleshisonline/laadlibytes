import { describe, expect, test } from '@jest/globals';

import { generateCode, hashCode } from '../../src/modules/otp/otp.service.js';

describe('generateCode', () => {
  test('always returns exactly six digits, including leading zeros', () => {
    for (let i = 0; i < 2000; i += 1) {
      expect(generateCode()).toMatch(/^\d{6}$/);
    }
  });
});

describe('hashCode', () => {
  const verificationId = 'a'.repeat(43);

  test('is a deterministic sha256 HMAC', () => {
    const hash = hashCode(verificationId, '123456');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashCode(verificationId, '123456')).toBe(hash);
  });

  test('changes with the code', () => {
    expect(hashCode(verificationId, '123456')).not.toBe(hashCode(verificationId, '123457'));
  });

  test('is bound to the verification id, so a code is useless on another challenge', () => {
    expect(hashCode(verificationId, '123456')).not.toBe(hashCode('b'.repeat(43), '123456'));
  });
});