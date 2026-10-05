import nodemailer from 'nodemailer';

import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

let transporter;

const getTransporter = () => {
  transporter ??= nodemailer.createTransport(env.SMTP_URL);
  return transporter;
};

const drivers = {
  smtp: (message) => getTransporter().sendMail({ from: env.EMAIL_FROM, ...message }),
  // Development stand-in until SMTP is configured. env.js refuses it in production.
  console: async ({ to, subject, text }) => {
    logger.info(`[email:console] to=${to} subject="${subject}"\n${text}`);
  },
};

/** sendEmail({ to, subject, text, html }) through the driver chosen by EMAIL_PROVIDER. */
export const sendEmail = (message) => drivers[env.EMAIL_PROVIDER](message);

export default sendEmail;