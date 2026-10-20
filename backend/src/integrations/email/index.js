import nodemailer from 'nodemailer';
import { Resend } from 'resend';

import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

let transporter;
let resendClient;

const getTransporter = () => {
  transporter ??= nodemailer.createTransport(env.SMTP_URL);
  return transporter;
};

const getResend = () => {
  resendClient ??= new Resend(env.RESEND_API_KEY);
  return resendClient;

}

const drivers = {
  smtp: (message) => getTransporter().sendMail({ from: env.EMAIL_FROM, ...message }),

  resend: async ({ to, subject, text, html }) => {
    const { data, error } = await getResend().emails.send({
      from: email.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });
     if (error) {
      logger.error(`[email:resend] failed to=${to} subject="${subject}": ${error.message}`);
      throw new Error(error.message || 'Email failed to send');
    }
    return data;
  },

  // Development stand-in until SMTP is configured. env.js refuses it in production.
  console: async ({ to, subject, text }) => {
    logger.info(`[email:console] to=${to} subject="${subject}"\n${text}`);
  },
};

/** sendEmail({ to, subject, text, html }) through the driver chosen by EMAIL_PROVIDER. */
export const sendEmail = (message) => drivers[env.EMAIL_PROVIDER](message);

export default sendEmail;