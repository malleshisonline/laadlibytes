import { describe, expect, test } from '@jest/globals';

import {
  deliveryDateFrom,
  deliveryDaysFor,
  LOCAL_DELIVERY_DAYS,
  STANDARD_DELIVERY_DAYS,
} from '../../src/utils/deliveryEstimate.js';

const istDay = (date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);

describe('deliveryDaysFor', () => {
  test('Hyderabad pincodes (500…) take 2 days, everywhere else 7', () => {
    expect(LOCAL_DELIVERY_DAYS).toBe(2);
    expect(STANDARD_DELIVERY_DAYS).toBe(7);
    expect(deliveryDaysFor('500081')).toBe(2);
    expect(deliveryDaysFor('500001')).toBe(2);
    expect(deliveryDaysFor('560001')).toBe(7);
    expect(deliveryDaysFor('501401')).toBe(7);
    expect(deliveryDaysFor('110001')).toBe(7);
  });

  test('a made-to-order hamper adds its lead time first', () => {
    expect(deliveryDaysFor('500081', 14)).toBe(16);
    expect(deliveryDaysFor('560001', 14)).toBe(21);
  });

  test('a missing pincode or lead time falls back to the standard days', () => {
    expect(deliveryDaysFor(undefined)).toBe(7);
    expect(deliveryDaysFor('560001', undefined)).toBe(7);
    expect(deliveryDaysFor('560001', -3)).toBe(7);
  });
});

describe('deliveryDateFrom', () => {
  test('counts calendar days, Sundays included', () => {
    // Saturday 7 Nov 2026, 10:00 IST.
    const start = new Date('2026-11-07T04:30:00Z');
    expect(istDay(deliveryDateFrom(start, 2))).toBe('2026-11-09');
    expect(istDay(deliveryDateFrom(start, 7))).toBe('2026-11-14');
    expect(istDay(deliveryDateFrom(start, 21))).toBe('2026-11-28');
  });

  test("counts from India's day: 11:30 pm IST is still that day, though UTC has the same date", () => {
    // 7 Nov 2026, 23:30 IST = 18:00 UTC on 7 Nov.
    expect(istDay(deliveryDateFrom(new Date('2026-11-07T18:00:00Z'), 2))).toBe('2026-11-09');
    // 8 Nov 2026, 00:30 IST = 19:00 UTC on 7 Nov: India is already on the 8th.
    expect(istDay(deliveryDateFrom(new Date('2026-11-07T19:00:00Z'), 2))).toBe('2026-11-10');
  });

  test('crosses month and year ends', () => {
    expect(istDay(deliveryDateFrom(new Date('2026-12-30T06:30:00Z'), 7))).toBe('2027-01-06');
  });

  test('returns noon in India, so the day reads the same in any time zone', () => {
    const date = deliveryDateFrom(new Date('2026-11-07T04:30:00Z'), 2);
    expect(date.toISOString()).toBe('2026-11-09T06:30:00.000Z');
  });
});