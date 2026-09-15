const ACTIONS = {
  register: 'finish creating your LaadliBytes account',
  login: 'sign in to LaadliBytes',
};

/** OTP email. `code` is digits only, so it is safe to interpolate into the HTML. */
export const otpEmail = ({ code, purpose, expiresInMinutes }) => {
  const action = ACTIONS[purpose];

  return {
    subject: `${code} is your LaadliBytes verification code`,
    text: [
      `Your verification code is ${code}.`,
      `Use it to ${action}. It expires in ${expiresInMinutes} minutes.`,
      '',
      "If you didn't request this code, you can ignore this email.",
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#222">
        <p>Use this code to ${action}:</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:6px;margin:24px 0">${code}</p>
        <p>It expires in ${expiresInMinutes} minutes.</p>
        <p style="color:#777;font-size:13px">If you didn't request this code, you can ignore this email.</p>
      </div>
    `,
  };
};

export default otpEmail;