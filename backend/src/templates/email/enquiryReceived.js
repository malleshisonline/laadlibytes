import { escapeHtml } from '../../utils/escapeHtml.js';

/** Sent to the shop (ENQUIRY_NOTIFY_EMAIL) for each Contact Us message. Reply-To is the customer. */
export const enquiryReceivedEmail = ({ name, email, subject, message }) => {
  const topic = subject || 'No subject';

  return {
    subject: `New contact message from ${name}: ${topic}`,
    text: [
      `Name: ${name}`,
      `Email: ${email}`,
      `Subject: ${topic}`,
      '',
      message,
      '',
      'Reply to this email to answer the customer directly.',
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#222">
        <h2 style="color:#043B65;margin:0 0 16px">New contact message</h2>
        <p style="margin:4px 0"><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p style="margin:4px 0"><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p style="margin:4px 0"><strong>Subject:</strong> ${escapeHtml(topic)}</p>
        <div style="margin:16px 0;padding:12px 16px;background:#F4F8FB;border-radius:8px;white-space:pre-wrap">${escapeHtml(message)}</div>
        <p style="color:#777;font-size:13px">Reply to this email to answer the customer directly.</p>
      </div>
    `,
  };
};

export default enquiryReceivedEmail;