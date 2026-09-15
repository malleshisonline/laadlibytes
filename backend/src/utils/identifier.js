import { parsePhoneNumberFromString } from 'libphonenumber-js/max';
import { z } from 'zod';

const DEFAULT_COUNTRY = 'IN';
const ALLOWED_COUNTRIES = ['IN'];
// Numbers that can receive an SMS. Plain landlines cannot.
const SMS_CAPABLE_TYPES = ['MOBILE', 'FIXED_LINE_OR_MOBILE'];

const emailSchema = z.email();

/**
 * Works out whether a sign-in input is an email or a phone number and normalizes it.
 * Returns { channel: 'email' | 'phone', value } or null when it is neither.
 *
 *   parseIdentifier('98765 43210')      -> { channel: 'phone', value: '+919876543210' }
 *   parseIdentifier('Renu@Example.com') -> { channel: 'email', value: 'renu@example.com' }
 */
export function parseIdentifier(raw) {
  const input = String(raw ?? '').trim();

  if (input.includes('@')) {
    const value = input.toLowerCase();
    return emailSchema.safeParse(value).success ? { channel: 'email', value } : null;
  }

  // Digits with the usual separators and an optional leading +; anything else is not a phone number.
  if (!/^\+?[\d\s\-().]{6,20}$/.test(input)) return null;

  const phone = parsePhoneNumberFromString(input, DEFAULT_COUNTRY);
  if (!phone?.isValid()) return null;
  if (!ALLOWED_COUNTRIES.includes(phone.country)) return null;
  if (!SMS_CAPABLE_TYPES.includes(phone.getType())) return null;

  return { channel: 'phone', value: phone.number };
}

/** Mongo filter for the User field matching the identifier's channel. */
export const identifierFilter = ({ channel, value }) => (channel === 'email' ? { email: value } : { phone: value });

/** Partially hidden identifier for responses: r***@gmail.com, +91******3210 */
export function maskIdentifier({ channel, value }) {
  if (channel === 'email') {
    const [local, domain] = value.split('@');
    return `${local[0]}***@${domain}`;
  }
  return `${value.slice(0, 3)}${'*'.repeat(Math.max(value.length - 7, 0))}${value.slice(-4)}`;
}

export default parseIdentifier;