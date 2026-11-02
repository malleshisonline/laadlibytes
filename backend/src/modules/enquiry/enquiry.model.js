import mongoose from 'mongoose';

// new → read (an admin opened it) → replied. Admins can also move it back.
export const ENQUIRY_STATUSES = ['new', 'read', 'replied'];

// 'contact' is the Contact Us form. 'bulk' is a gift hamper bulk or corporate quote request, the only
// place custom hampers are asked for. Messages saved before bulk enquiries existed have no type: contact.
export const ENQUIRY_TYPES = ['contact', 'bulk'];

/** One Contact Us message. Guests can send these, so `user` is only set when the sender was signed in. */
const enquirySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ENQUIRY_TYPES, default: 'contact' },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, lowercase: true, trim: true },
    subject: { type: String, trim: true, maxlength: 150, default: '' },
    message: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    // Bulk enquiries only.
    company: { type: String, trim: true, maxlength: 120 },
    phone: { type: String, trim: true },
    hamper: { type: mongoose.Schema.Types.ObjectId, ref: 'GiftHamper' },
    quantity: { type: Number, min: 1 },
    status: { type: String, enum: ENQUIRY_STATUSES, default: 'new' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    // Kept for abuse investigation only; never returned by the API.
    ip: { type: String, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.ip;
        return ret;
      },
    },
  }
);

enquirySchema.index({ status: 1, createdAt: -1 });

export const Enquiry = mongoose.model('Enquiry', enquirySchema);

export default Enquiry;