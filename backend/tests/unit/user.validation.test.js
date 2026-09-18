import { describe, expect, test } from '@jest/globals';

import {
  USER_SORTS,
  listUsersQuerySchema,
  updateUserSchema,
  userIdParamSchema,
} from '../../src/modules/user/user.validation.js';

const parseQuery = (query) => listUsersQuerySchema.safeParse(query);

describe('listUsersQuerySchema sort whitelist', () => {
  test.each(USER_SORTS.map((sort) => [sort]))('accepts the whitelisted sort %s', (sort) => {
    const result = parseQuery({ sort });

    expect(result.success).toBe(true);
    expect(result.data.sort).toBe(sort);
  });

  test('defaults to newest, which is the descending createdAt the list used before', () => {
    expect(parseQuery({}).data.sort).toBe('newest');
  });

  /**
   * The point of the whitelist: `.sort()` used to receive the raw string, so any field on the
   * document — including the select:false ones — could be ordered by, and the ordering of a
   * password hash leaks information about it.
   */
  test.each([['password'], ['-password'], ['refreshTokens'], ['-refreshTokens']])(
    'refuses %s, so a caller cannot order by a secret',
    (sort) => {
      expect(parseQuery({ sort }).success).toBe(false);
    }
  );

  test.each([['-createdAt'], ['createdAt'], ['lastLoginAt'], ['{"createdAt":-1}'], ['']])(
    'refuses the raw Mongo sort expression %s',
    (sort) => {
      expect(parseQuery({ sort }).success).toBe(false);
    }
  );

  test('rejects rather than silently falling back, so a typo is visible', () => {
    const result = parseQuery({ sort: 'newset' });

    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(['sort']);
  });

  test('every label has exactly one meaning: no duplicates in the list', () => {
    expect(new Set(USER_SORTS).size).toBe(USER_SORTS.length);
  });
});

describe('listUsersQuerySchema paging and filters', () => {
  test('coerces the page and limit query strings to numbers', () => {
    const { data } = parseQuery({ page: '3', limit: '50' });

    expect(data).toMatchObject({ page: 3, limit: 50 });
  });

  test('defaults to the first page of 20', () => {
    expect(parseQuery({})).toMatchObject({ data: { page: 1, limit: 20 } });
  });

  test.each([['0'], ['-1'], ['1.5']])('refuses page %s', (page) => {
    expect(parseQuery({ page }).success).toBe(false);
  });

  test('caps limit at 100, so a caller cannot ask for the whole collection', () => {
    expect(parseQuery({ limit: '100' }).success).toBe(true);
    expect(parseQuery({ limit: '101' }).success).toBe(false);
  });

  test('accepts a known role and refuses anything else', () => {
    expect(parseQuery({ role: 'admin' }).data.role).toBe('admin');
    expect(parseQuery({ role: 'superadmin' }).success).toBe(false);
  });

  test('trims the search term', () => {
    expect(parseQuery({ search: '  renu  ' }).data.search).toBe('renu');
  });
});

describe('updateUserSchema', () => {
  test('refuses an empty patch', () => {
    expect(updateUserSchema.safeParse({}).success).toBe(false);
  });

  test('allows an admin to change the role and the deactivation switch', () => {
    expect(updateUserSchema.safeParse({ role: 'admin', isActive: false }).success).toBe(true);
  });

  test('refuses a role outside USER_ROLES', () => {
    expect(updateUserSchema.safeParse({ role: 'owner' }).success).toBe(false);
  });

  test('does not accept password or refreshTokens: those are not admin-editable', () => {
    const { data } = updateUserSchema.safeParse({ name: 'Renu', password: 'hunter2hunter2' });

    expect(data.password).toBeUndefined();
  });
});

describe('userIdParamSchema', () => {
  test('accepts a 24-hex id', () => {
    expect(userIdParamSchema.safeParse({ id: '6aacc7913c02101c3a8d21c4' }).success).toBe(true);
  });

  test.each([['not-an-id'], ['6aacc7913c02101c3a8d21c'], ['']])('refuses %s', (id) => {
    expect(userIdParamSchema.safeParse({ id }).success).toBe(false);
  });
});
