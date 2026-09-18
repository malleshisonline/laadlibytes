import mongoose from 'mongoose';

/** The paths added by `auditFields`, so the strip helper and the `.select('+…')` callers agree. */
export const AUDIT_FIELDS = ['createdBy', 'updatedBy'];

/**
 * Which admin last touched a row. Spread into a schema definition:
 *
 *   const productSchema = new mongoose.Schema({ name: …, ...auditFields() }, { timestamps: true });
 *
 * Optional, because the seeder writes the initial catalogue with no admin in scope, and
 * `select: false`, so the storefront never carries internal user ids.
 */
export const auditFields = () => ({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', select: false },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', select: false },
});

/**
 * `select: false` keeps these out of query results, but a document built in memory still carries
 * whatever was just set on it — so a create response would otherwise hand back a raw user id.
 * Same reasoning as the `delete ret.password` in user.model.js.
 *
 * A populated ref is an object rather than an id, so this drops the bare ids and keeps the
 * resolved `{ id, name, … }` that the admin detail routes explicitly ask for.
 */
const isPopulatedRef = (value) =>
  value !== null && typeof value === 'object' && !(value instanceof mongoose.Types.ObjectId);

export const stripUnpopulatedAuditRefs = (ret) => {
  AUDIT_FIELDS.forEach((field) => {
    if (field in ret && !isPopulatedRef(ret[field])) delete ret[field];
  });
  return ret;
};

export default auditFields;