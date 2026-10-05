import nodemailer from 'nodemailer';

import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import dns from 'node:dns';

let transporter;

const getTransporter = () => {
  if (!transporter) {
    const smtpUrl = new URL(env.SMTP_URL);

    transporter = nodemailer.createTransport({
      host: smtpUrl.hostname,
      port: Number(smtpUrl.port),
      secure: smtpUrl.protocol === 'smtps:',
      auth: {
        user: decodeURIComponent(smtpUrl.username),
        pass: decodeURIComponent(smtpUrl.password),
      },
      lookup: (hostname, options, callback) => {
        dns.lookup(hostname, { family: 4 }, callback);
      },
    });
  }

  return transporter;
};

const drivers = {
  smtp: (message) => getTransporter().sendMail({ from: env.EMAIL_FROM, ...message }),

  console: async ({ to, subject, text }) => {
    logger.info(`[email:console] to=${to} subject="${subject}"\n${text}`);
  },
};

/** sendEmail({ to, subject, text, html }) through the driver chosen by EMAIL_PROVIDER. */
export const sendEmail = (message) => drivers[env.EMAIL_PROVIDER](message);

export default sendEmail;