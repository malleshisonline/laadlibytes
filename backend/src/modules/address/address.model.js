import mongoose from 'mongoose';

export const MAX_ADDRESSES = 5;

// 28 states and 8 union territories, by their official short names. frontend/src/constants/indianStates.js
// keeps the same list for the dropdown; change both together.
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

/**
 * A saved delivery address. Orders will copy the fields they need at checkout rather than
 * referencing this document, so editing or deleting an address never changes a past order.
 */
const addressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    phone: { type: String, required: true, trim: true }, // E.164, e.g. +919876543210
    pincode: { type: String, required: true, trim: true, match: /^[1-9]\d{5}$/ },
    line1: { type: String, required: true, trim: true, maxlength: 120 },
    line2: { type: String, trim: true, maxlength: 120 },
    landmark: { type: String, trim: true, maxlength: 80 },
    city: { type: String, required: true, trim: true, maxlength: 60 },
    state: { type: String, required: true, enum: INDIAN_STATES },
    isDefault: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.user;
        return ret;
      },
    },
  }
);

addressSchema.index({ user: 1, createdAt: -1 });

export const Address = mongoose.model('Address', addressSchema);

export default Address;