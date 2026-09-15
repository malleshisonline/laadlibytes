import crypto from 'node:crypto';

import { StatusCodes } from 'http-status-codes';

import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { sendEmail } from '../../integrations/email/index.js';
import { sendOtpSms } from '../../integrations/sms/index.js';
import { otpEmail } from '../../templates/email/otp.js';
import { ApiError } from '../../utils/ApiError.js';
import { maskIdentifier } from '../../utils/identifier.js';
import { hashToken } from '../../utils/token.js';

import { OtpChallenge } from './otp.model.js';

export const OTP_LENGTH = 6;
export const OTP_TTL_SECONDS = 10 * 60;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const OTP_MAX_SENDS = 5;

export const generateCode = () => crypto.randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, '0');

// Keyed: six digits are trivial to brute-force from a plain hash if the database leaks.
export const hashCode = (verificationId, code) =>
  crypto.createHmac('sha256', env.OTP_SECRET).update(`${verificationId}:${code}`).digest('hex');

const hashesMatch = (a, b) => {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

const expiredError = () =>
  ApiError.badRequest('This code has expired. Please request a new one', { code: 'OTP_EXPIRED' });

const cooldownError = (seconds) =>
  ApiError.tooMany(`Please wait ${seconds} seconds before requesting another code`, {
    code: 'OTP_COOLDOWN',
    details: [{ field: 'retryAfterSeconds', message: `Retry in ${seconds} seconds`, value: seconds }],
  });

function assertCanSend(challenge, now) {
  if (challenge.sendCount >= OTP_MAX_SENDS) {
    throw ApiError.tooMany('Too many codes requested. Please try again later', { code: 'OTP_SEND_LIMIT' });
  }
  const readyAt = challenge.lastSentAt.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000;
  const waitSeconds = Math.ceil((readyAt - now.getTime()) / 1000);
  if (waitSeconds > 0) throw cooldownError(waitSeconds);
}

/**
 * Inserts a new challenge or updates `existing`. The update only applies if nobody else
 * sent a code since `existing` was read, so concurrent requests cannot skip the cooldown.
 */
async function saveChallenge(existing, fields) {
  if (!existing) {
    try {
      const created = await OtpChallenge.create(fields);
      return created._id;
    } catch (err) {
      if (err?.code === 11000) throw cooldownError(OTP_RESEND_COOLDOWN_SECONDS);
      throw err;
    }
  }

  const { matchedCount } = await OtpChallenge.updateOne(
    { _id: existing._id, lastSentAt: existing.lastSentAt },
    { $set: fields }
  );
  if (!matchedCount) throw cooldownError(OTP_RESEND_COOLDOWN_SECONDS);
  return existing._id;
}

async function deliver(challengeId, { channel, identifier, purpose }, code) {
  try {
    if (channel === 'email') {
      await sendEmail({ to: identifier, ...otpEmail({ code, purpose, expiresInMinutes: OTP_TTL_SECONDS / 60 }) });
    } else {
      await sendOtpSms({ to: identifier, code });
    }
  } catch (err) {
    logger.error('OTP delivery failed', { channel, error: err?.message });
    // Nothing reached the user, so let them retry straight away instead of waiting out the cooldown.
    await OtpChallenge.updateOne({ _id: challengeId }, { $set: { lastSentAt: new Date(0) } });
    throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, 'Could not send the verification code. Please try again', {
      code: 'OTP_DELIVERY_FAILED',
      cause: err,
    });
  }
}

const summary = (verificationId, { identifier, channel, purpose }) => ({
  verificationId,
  purpose,
  channel,
  destination: maskIdentifier({ channel, value: identifier }),
  expiresInSeconds: OTP_TTL_SECONDS,
  resendAfterSeconds: OTP_RESEND_COOLDOWN_SECONDS,
});

const expiryFrom = (now) => new Date(now.getTime() + OTP_TTL_SECONDS * 1000);

/** Code generation, storage, limits and delivery. Callers decide what a verified code unlocks. */
export const otpService = {
  /** Starts (or restarts) a challenge and sends a fresh code. Any earlier code for the same identifier and purpose stops working. */
  async issue({ identifier, channel, purpose, pendingUser }) {
    const now = new Date();
    const existing = await OtpChallenge.findOne({ identifier, purpose }).lean();
    const live = existing && existing.expiresAt > now;
    if (live) assertCanSend(existing, now);

    const verificationId = crypto.randomBytes(32).toString('base64url');
    const code = generateCode();
    const target = { identifier, channel, purpose };

    const challengeId = await saveChallenge(existing, {
      ...target,
      verificationIdHash: hashToken(verificationId),
      codeHash: hashCode(verificationId, code),
      attempts: 0,
      // Carried over while the challenge is live, so resubmitting the form cannot reset the cap.
      sendCount: live ? existing.sendCount + 1 : 1,
      lastSentAt: now,
      expiresAt: expiryFrom(now),
      ...(pendingUser ? { pendingUser } : {}),
    });

    await deliver(challengeId, target, code);
    return summary(verificationId, target);
  },

  /** Sends a new code for an existing challenge. The verificationId stays the same. */
  async resend(verificationId) {
    const now = new Date();
    const challenge = await OtpChallenge.findOne({ verificationIdHash: hashToken(verificationId) }).lean();
    if (!challenge || challenge.expiresAt <= now) throw expiredError();
    assertCanSend(challenge, now);

    const code = generateCode();
    await saveChallenge(challenge, {
      codeHash: hashCode(verificationId, code),
      attempts: 0,
      sendCount: challenge.sendCount + 1,
      lastSentAt: now,
      expiresAt: expiryFrom(now),
    });

    await deliver(challenge._id, challenge, code);
    return summary(verificationId, challenge);
  },

  /**
   * Checks the code and, on success, deletes the challenge so it cannot be used twice.
   * Returns { identifier, channel, purpose, pendingUser }.
   */
  async consume(verificationId, code) {
    const now = new Date();
    const challenge = await OtpChallenge.findOne({ verificationIdHash: hashToken(verificationId) })
      .select('+codeHash +pendingUser')
      .lean();
    if (!challenge || challenge.expiresAt <= now) throw expiredError();

    const tooManyAttempts = () =>
      ApiError.tooMany('Too many incorrect attempts. Please request a new code', { code: 'OTP_ATTEMPTS_EXCEEDED' });

    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      await OtpChallenge.deleteOne({ _id: challenge._id });
      throw tooManyAttempts();
    }

    if (!hashesMatch(challenge.codeHash, hashCode(verificationId, code))) {
      await OtpChallenge.updateOne({ _id: challenge._id }, { $inc: { attempts: 1 } });
      const remaining = OTP_MAX_ATTEMPTS - (challenge.attempts + 1);
      if (remaining <= 0) {
        await OtpChallenge.deleteOne({ _id: challenge._id });
        throw tooManyAttempts();
      }
      throw ApiError.badRequest(`Incorrect code. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} left`, {
        code: 'OTP_INVALID',
      });
    }

    // Only the request that actually removes the challenge may use it; a parallel duplicate gets "expired".
    const { deletedCount } = await OtpChallenge.deleteOne({
      _id: challenge._id,
      verificationIdHash: challenge.verificationIdHash,
    });
    if (!deletedCount) throw expiredError();

    const { identifier, channel, purpose, pendingUser } = challenge;
    return { identifier, channel, purpose, pendingUser };
  },
};

export default otpService;