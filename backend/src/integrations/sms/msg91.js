import { env } from '../../config/env.js';

const MSG91_OTP_URL = 'https://control.msg91.com/api/v5/otp';
const TIMEOUT_MS = 10_000;

/**
 * Delivers our own code through MSG91's OTP API using the DLT-approved template.
 * The code is generated and checked by otp.service; MSG91 only sends it.
 * `to` is E.164; MSG91 expects the number without the leading "+".
 */
export async function sendMsg91Otp({ to, code }) {
  const url = new URL(MSG91_OTP_URL);
  url.searchParams.set('template_id', env.MSG91_OTP_TEMPLATE_ID);
  url.searchParams.set('mobile', to.replace(/^\+/, ''));
  url.searchParams.set('otp', code);

  const response = await fetch(url, {
    method: 'POST',
    headers: { authkey: env.MSG91_AUTH_KEY, 'Content-Type': 'application/json' },
    body: '{}',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.type !== 'success') {
    throw new Error(`MSG91 OTP send failed (HTTP ${response.status}): ${body.message ?? 'unknown error'}`);
  }
}

export default sendMsg91Otp;