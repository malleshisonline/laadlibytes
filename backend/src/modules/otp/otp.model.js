import mongoose from 'mongoose';

export const OTP_PURPOSES = ['register', 'login'];
export const OTP_CHANNELS = ['email', 'phone'];

const pendingUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
  },
  { _id: false }
);

const otpChallengeSchema = new mongoose.Schema(
  {
    // sha256 of the id handed to the client that requested the code; only that client can verify.
    verificationIdHash: {
      type: String,
      required: true,
      unique: true,
    },
    // Normalized email or E.164 phone the code was sent to.
    identifier: {
      type: String,
      required: true,
    },
    channel: {
      type: String,
      enum: OTP_CHANNELS,
      required: true,
    },
    purpose: {
      type: String,
      enum: OTP_PURPOSES,
      required: true,
    },
    // HMAC of the code; the code itself is never stored.
    codeHash: {
      type: String,
      required: true,
      select: false,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    sendCount: {
      type: Number,
      default: 1,
    },
    lastSentAt: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    // Register only: the sign-up form, held here so no User exists until the identifier is verified.
    pendingUser: {
      type: pendingUserSchema,
      default: undefined,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.verificationIdHash;
        delete ret.codeHash;
        delete ret.pendingUser;
        return ret;
      },
    },
  }
);

// One live challenge per identifier and purpose; a new send replaces the old one.
otpChallengeSchema.index({ identifier: 1, purpose: 1 }, { unique: true });
// MongoDB removes expired challenges (the TTL monitor runs about once a minute, so code checks expiry too).
otpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpChallenge = mongoose.model('OtpChallenge', otpChallengeSchema);

export default OtpChallenge;