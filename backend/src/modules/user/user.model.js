import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import { env } from '../../config/env.js';

export const USER_ROLES = ['user', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    // A user signs up with either an email or a phone number, so each is required only without the other.
    email: {
      type: String,
      required: [
        function emailRequired() {
          return !this.phone;
        },
        'Email or phone is required',
      ],
      lowercase: true,
      trim: true,
    },
    // E.164, e.g. +919876543210
    phone: {
      type: String,
      required: [
        function phoneRequired() {
          return !this.email;
        },
        'Email or phone is required',
      ],
      trim: true,
    },
    // Set once the identifier has been proven with an OTP. Separate from isActive, which is an admin switch.
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    phoneVerifiedAt: {
      type: Date,
      default: null,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false, // never comes back unless explicitly asked for
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: Date,
    // sha256 hashes of issued refresh tokens, so a DB dump cannot be replayed
    refreshTokens: {
      type: [{ token: String, createdAt: { type: Date, default: Date.now } }],
      default: [],
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.refreshTokens;
        return ret;
      },
    },
  }
);

// Partial, because a plain unique index treats a missing field as null and the
// second phone-only (or email-only) user would collide on it.
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });
userSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { phone: { $type: 'string' } } });

// Mongoose 9 no longer passes `next` to middleware; returning is enough.
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  // Sign-up hashes the password before the OTP step, so it must not be hashed twice.
  if (this.$locals.passwordIsHashed) return;
  this.password = await bcrypt.hash(this.password, env.BCRYPT_SALT_ROUNDS);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model('User', userSchema);

export default User;