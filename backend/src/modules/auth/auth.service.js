import bcrypt from 'bcryptjs';

import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { identifierFilter } from '../../utils/identifier.js';
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/token.js';
import { otpService } from '../otp/otp.service.js';
import { User } from '../user/user.model.js';

const MAX_SESSIONS = 5;

const VERIFIED_AT_FIELD = { email: 'emailVerifiedAt', phone: 'phoneVerifiedAt' };

const issueTokens = (user) => {
  const payload = { sub: user.id, role: user.role };
  return { accessToken: signAccessToken(payload), refreshToken: signRefreshToken(payload) };
};

/** Issues a token pair and records the refresh token hash, keeping at most MAX_SESSIONS. */
async function startSession(user, extraFields = {}) {
  const tokens = issueTokens(user);

  await User.updateOne(
    { _id: user._id },
    {
      $set: { lastLoginAt: new Date(), ...extraFields },
      $push: {
        refreshTokens: { $each: [{ token: hashToken(tokens.refreshToken) }], $slice: -MAX_SESSIONS },
      },
    }
  );

  return { user, ...tokens };
}

const assertActive = (user) => {
  if (!user.isActive) throw ApiError.forbidden('Account is deactivated', { code: 'ACCOUNT_DEACTIVATED' });
};

const accountExists = () =>
  ApiError.conflict('An account already exists for this email or mobile number', { code: 'ACCOUNT_EXISTS' });

const accountNotFound = () =>
  ApiError.notFound('No account found for this email or mobile number', { code: 'ACCOUNT_NOT_FOUND' });

export const authService = {
  /** Sign-in step 1: tells the client whether to ask for a password or offer account creation. */
  async identify(identifier) {
    const exists = await User.exists(identifierFilter(identifier));
    return { channel: identifier.channel, identifier: identifier.value, exists: Boolean(exists) };
  },

  async login({ identifier, password }) {
    const user = await User.findOne(identifierFilter(identifier)).select('+password');
    // Same message either way, so a wrong password and an unknown account look alike here.
    if (!user || !(await user.comparePassword(password))) {
      throw ApiError.unauthorized('Invalid email, mobile number or password', { code: 'INVALID_CREDENTIALS' });
    }
    assertActive(user);

    return startSession(user);
  },

  async requestLoginOtp({ identifier }) {
    const user = await User.findOne(identifierFilter(identifier)).select('isActive').lean();
    if (!user) throw accountNotFound();
    // Checked before sending, so a deactivated account never costs an SMS.
    assertActive(user);

    return otpService.issue({ identifier: identifier.value, channel: identifier.channel, purpose: 'login' });
  },

  /** Sign-up step 1: holds the form data with the OTP challenge. No User exists until verification. */
  async startRegistration({ identifier, name, password }) {
    if (await User.exists(identifierFilter(identifier))) throw accountExists();

    const passwordHash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

    return otpService.issue({
      identifier: identifier.value,
      channel: identifier.channel,
      purpose: 'register',
      pendingUser: { name, passwordHash },
    });
  },

  resendOtp({ verificationId }) {
    return otpService.resend(verificationId);
  },

  /** Completes either flow. The challenge's stored purpose decides which, never the client. */
  async verifyOtp({ verificationId, otp }) {
    const { identifier, channel, purpose, pendingUser } = await otpService.consume(verificationId, otp);
    const filter = identifierFilter({ channel, value: identifier });
    const verifiedField = VERIFIED_AT_FIELD[channel];

    if (purpose === 'login') {
      const user = await User.findOne(filter);
      if (!user) throw accountNotFound();
      assertActive(user);

      // The code proved ownership, so record it for accounts that were never verified.
      const extraFields = user[verifiedField] ? {} : { [verifiedField]: new Date() };
      Object.assign(user, extraFields);

      return { purpose, ...(await startSession(user, extraFields)) };
    }

    // Someone else may have finished signing up with this identifier since the code was sent.
    if (await User.exists(filter)) throw accountExists();

    const user = new User({
      name: pendingUser.name,
      password: pendingUser.passwordHash,
      [channel]: identifier,
      [verifiedField]: new Date(),
    });
    user.$locals.passwordIsHashed = true;

    try {
      await user.save();
    } catch (err) {
      if (err?.code === 11000) throw accountExists();
      throw err;
    }

    return { purpose, ...(await startSession(user)) };
  },

  async refresh(refreshToken) {
    if (!refreshToken) throw ApiError.unauthorized('Refresh token missing');

    const payload = verifyRefreshToken(refreshToken);
    const hashed = hashToken(refreshToken);

    const user = await User.findById(payload.sub).select('+refreshTokens');
    if (!user || !user.isActive) throw ApiError.unauthorized('Session is no longer valid');

    const known = user.refreshTokens.some((entry) => entry.token === hashed);
    if (!known) throw ApiError.unauthorized('Refresh token has been revoked');

    const tokens = issueTokens(user);

    // Rotation: the presented token is retired as the replacement is stored.
    user.refreshTokens = [
      ...user.refreshTokens.filter((entry) => entry.token !== hashed),
      { token: hashToken(tokens.refreshToken) },
    ].slice(-MAX_SESSIONS);
    await user.save();

    return { user, ...tokens };
  },

  async logout(userId, refreshToken) {
    if (!userId) return;

    if (refreshToken) {
      await User.updateOne({ _id: userId }, { $pull: { refreshTokens: { token: hashToken(refreshToken) } } });
      return;
    }
    // No token presented: sign out every session for this user.
    await User.updateOne({ _id: userId }, { $set: { refreshTokens: [] } });
  },
};

export default authService;