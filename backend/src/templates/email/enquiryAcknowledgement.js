import { escapeHtml } from '../../utils/escapeHtml.js';

export const ENQUIRY_REPLY_PROMISE = 'within 1 working day';

/** Auto-reply to the customer confirming their Contact Us message arrived. */
export const enquiryAcknowledgementEmail = ({ name, message }) => ({
  subject: 'We received your message – Laadli Bytes',
  text: [
    `Hi ${name},`,
    '',
    `Thank you for contacting Laadli Bytes! We have received your message and will reply ${ENQUIRY_REPLY_PROMISE}.`,
    '',
    'Your message:',
    message,
    '',
    '— Team Laadli Bytes',
  ].join('\n'),
  html: `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#222">
      <p>Hi ${escapeHtml(name)},</p>
      <p>Thank you for contacting <strong>Laadli Bytes</strong>! We have received your message and will reply ${ENQUIRY_REPLY_PROMISE}.</p>
      <p style="margin:16px 0 4px;color:#777;font-size:13px">Your message:</p>
      <div style="padding:12px 16px;background:#F4F8FB;border-radius:8px;white-space:pre-wrap">${escapeHtml(message)}</div>
      <p style="margin-top:24px">— Team Laadli Bytes</p>
    </div>
  `,
});

export default enquiryAcknowledgementEmail;