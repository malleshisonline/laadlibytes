import { ApiError } from '../../utils/ApiError.js';
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/token.js';
import { User } from '../user/user.model.js';

const MAX_SESSIONS = 5;

const issueTokens = (user) => {
  const payload = { sub: user.id, role: user.role };
  return { accessToken: signAccessToken(payload), refreshToken: signRefreshToken(payload) };
};

export const authService = {
  async register({ name, email, password }) {
    const exists = await User.exists({ email });
    if (exists) throw ApiError.conflict('Email already registered');

    const user = await User.create({ name, email, password });
    const tokens = issueTokens(user);

    await User.updateOne(
      { _id: user._id },
      {
        $push: {
          refreshTokens: { $each: [{ token: hashToken(tokens.refreshToken) }], $slice: -MAX_SESSIONS },
        },
      }
    );

    return { user, ...tokens };
  },

  async login({ email, password }) {
    const user = await User.findOne({ email }).select('+password');
    // Same message either way, so this endpoint cannot be used to enumerate accounts.
    if (!user || !(await user.comparePassword(password))) {
      throw ApiError.unauthorized('Invalid email or password');
    }
    if (!user.isActive) throw ApiError.forbidden('Account is deactivated');

    const tokens = issueTokens(user);

    await User.updateOne(
      { _id: user._id },
      {
        $set: { lastLoginAt: new Date() },
        $push: {
          refreshTokens: { $each: [{ token: hashToken(tokens.refreshToken) }], $slice: -MAX_SESSIONS },
        },
      }
    );

    return { user, ...tokens };
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
