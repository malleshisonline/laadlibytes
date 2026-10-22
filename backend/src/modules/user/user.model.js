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
    // A guest customer has no password: it is a record of someone who checked out without an account.
    password: {
      type: String,
      required: [
        function passwordRequired() {
          return !this.isGuest;
        },
        'Password is required',
      ],
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
    // Made by a guest checkout, found by phone. It cannot sign in; signing up with that phone and
    // verifying the OTP turns it into a normal account (auth.service.js), keeping its orders and addresses.
    isGuest: {
      type: Boolean,
      default: false,
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

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  // A guest customer has no password, so nothing matches it.
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model('User', userSchema);

export default User;