import { describe, expect, test } from '@jest/globals';

import { identifierFilter, maskIdentifier, parseIdentifier } from '../../src/utils/identifier.js';

describe('parseIdentifier', () => {
  test.each([
    ['9876543210'],
    ['98765 43210'],
    ['98765-43210'],
    ['+91 98765 43210'],
    ['+91-9876543210'],
    ['09876543210'],
  ])('normalizes the Indian mobile number %s to E.164', (input) => {
    expect(parseIdentifier(input)).toEqual({ channel: 'phone', value: '+919876543210' });
  });

  test('trims and lowercases an email', () => {
    expect(parseIdentifier('  Renu@Example.COM ')).toEqual({ channel: 'email', value: 'renu@example.com' });
  });

  test.each([
    ['', 'empty'],
    ['12345', 'too short'],
    ['1234567890', 'not a valid Indian range'],
    ['+14155552671', 'valid, but not an Indian number'],
    ['+91 22 2345 6789', 'an Indian landline that cannot receive SMS'],
    ['renu@', 'an incomplete email'],
    ['hello world', 'neither'],
  ])('rejects %p (%s)', (input) => {
    expect(parseIdentifier(input)).toBeNull();
  });
});

describe('identifierFilter', () => {
  test('targets the field matching the channel', () => {
    expect(identifierFilter({ channel: 'email', value: 'a@b.com' })).toEqual({ email: 'a@b.com' });
    expect(identifierFilter({ channel: 'phone', value: '+919876543210' })).toEqual({ phone: '+919876543210' });
  });
});

describe('maskIdentifier', () => {
  test('hides most of an email local part', () => {
    expect(maskIdentifier({ channel: 'email', value: 'renu@gmail.com' })).toBe('r***@gmail.com');
  });

  test('keeps the country code and last four digits of a phone number', () => {
    expect(maskIdentifier({ channel: 'phone', value: '+919876543210' })).toBe('+91******3210');
  });
});