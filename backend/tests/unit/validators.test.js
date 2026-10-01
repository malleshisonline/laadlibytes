import { describe, expect, test } from '@jest/globals';

import { indianMobileSchema, passwordSchema, pincodeSchema } from '../../src/utils/validators.js';

describe('passwordSchema', () => {
  test('accepts 8+ characters with a lowercase letter, an uppercase letter and a digit', () => {
    expect(passwordSchema.safeParse('Secret123').success).toBe(true);
  });

  test.each([['Sh0rt'], ['alllower123'], ['ALLUPPER123'], ['NoDigitsHere']])('refuses %s', (value) => {
    expect(passwordSchema.safeParse(value).success).toBe(false);
  });
});

describe('indianMobileSchema', () => {
  test.each([['9876543210'], ['98765 43210'], ['+91 98765-43210'], ['09876543210']])(
    'normalizes %s to E.164',
    (value) => {
      expect(indianMobileSchema.parse(value)).toBe('+919876543210');
    }
  );

  test.each([['12345'], ['renu@example.com'], ['+1 202 555 0143'], ['']])('refuses %s', (value) => {
    expect(indianMobileSchema.safeParse(value).success).toBe(false);
  });
});

describe('pincodeSchema', () => {
  test('accepts six digits not starting with 0, trimming spaces', () => {
    expect(pincodeSchema.parse(' 500081 ')).toBe('500081');
  });

  test.each([['012345'], ['50008'], ['5000811'], ['50o081']])('refuses %s', (value) => {
    expect(pincodeSchema.safeParse(value).success).toBe(false);
  });
});