import mongoose from 'mongoose';

// new → read (an admin opened it) → replied. Admins can also move it back.
export const ENQUIRY_STATUSES = ['new', 'read', 'replied'];

/** One Contact Us message. Guests can send these, so `user` is only set when the sender was signed in. */
const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, lowercase: true, trim: true },
    subject: { type: String, trim: true, maxlength: 150, default: '' },
    message: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
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