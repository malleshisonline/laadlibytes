import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

import { sendMsg91Otp } from './msg91.js';

const drivers = {
  msg91: sendMsg91Otp,
  // Development stand-in until DLT registration is approved. env.js refuses it in production.
  console: async ({ to, code }) => {
    logger.info(`[sms:console] to=${to} code=${code}`);
  },
};

/** sendOtpSms({ to, code }) through the driver chosen by SMS_PROVIDER. `to` is E.164. */
export const sendOtpSms = ({ to, code }) => drivers[env.SMS_PROVIDER]({ to, code });

export default sendOtpSms;