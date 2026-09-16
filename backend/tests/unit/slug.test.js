import { describe, expect, test } from '@jest/globals';

import { slugify } from '../../src/utils/slug.js';

describe('slugify', () => {
  test.each([
    ['Women Wellness', 'women-wellness'],
    ['Peanut Chikki', 'peanut-chikki'],
    ['Nuts n Seeds', 'nuts-n-seeds'],
    ['Millets n Nuts', 'millets-n-nuts'],
    ['Kids Wellness', 'kids-wellness'],
    ['Fruit Variant', 'fruit-variant'],
  ])('turns the category name %s into %s', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  test('slugifies a product name', () => {
    expect(slugify('Mango Alohas')).toBe('mango-alohas');
  });

  test('is idempotent, so re-slugifying an existing slug is safe', () => {
    expect(slugify('mango-alohas')).toBe('mango-alohas');
  });

  test('expands & rather than dropping it and running the words together', () => {
    expect(slugify('Nuts & Seeds')).toBe('nuts-and-seeds');
  });

  test('strips accents down to the base letter instead of deleting them', () => {
    expect(slugify('Puréed Fruit')).toBe('pureed-fruit');
  });

  test.each([
    ['  Mango   Alohas  ', 'mango-alohas'],
    ['Multiple---Hyphens', 'multiple-hyphens'],
    ['-Leading and trailing-', 'leading-and-trailing'],
    ['Mango Alohas (100 gm)', 'mango-alohas-100-gm'],
  ])('normalises punctuation and spacing in %s', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  test('keeps digits, so an SKU-like name survives', () => {
    expect(slugify('FF-01')).toBe('ff-01');
  });

  test.each([[''], [null], [undefined], ['!!!']])(
    'returns an empty string for %s, leaving the caller to reject it',
    (input) => {
      expect(slugify(input)).toBe('');
    }
  );
});