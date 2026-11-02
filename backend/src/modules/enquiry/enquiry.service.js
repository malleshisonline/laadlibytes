import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { sendEmail } from '../../integrations/email/index.js';
import { enquiryAcknowledgementEmail } from '../../templates/email/enquiryAcknowledgement.js';
import { enquiryReceivedEmail } from '../../templates/email/enquiryReceived.js';
import { ApiError } from '../../utils/ApiError.js';
import { buildMeta, getPagination } from '../../utils/pagination.js';
import { giftHamperService } from '../giftHamper/giftHamper.service.js';

import { Enquiry } from './enquiry.model.js';

const BULK_FIELDS = ['company', 'phone', 'hamper', 'quantity'];

const ENQUIRY_SORT_MAP = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Both emails are best-effort: the enquiry is already saved, so a mail failure is logged for the
 * admin to notice rather than turned into an error the customer would retry (and duplicate).
 */
async function sendEnquiryEmails(enquiry) {
  const deliveries = [];

  if (env.ENQUIRY_NOTIFY_EMAIL) {
    deliveries.push({
      kind: 'notification',
      send: sendEmail({ to: env.ENQUIRY_NOTIFY_EMAIL, replyTo: enquiry.email, ...enquiryReceivedEmail(enquiry) }),
    });
  } else {
    logger.warn('ENQUIRY_NOTIFY_EMAIL is not set; enquiry saved but nobody was notified', { enquiryId: enquiry.id });
  }
  deliveries.push({ kind: 'acknowledgement', send: sendEmail({ to: enquiry.email, ...enquiryAcknowledgementEmail(enquiry) }) });

  const results = await Promise.allSettled(deliveries.map((delivery) => delivery.send));
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      logger.error('Enquiry email failed', {
        kind: deliveries[index].kind,
        enquiryId: enquiry.id,
        error: result.reason?.message,
      });
    }
  });
}

/** Data access + business rules. Controllers stay free of Mongoose. */
export const enquiryService = {
  /** Saves a Contact Us message and sends the emails. Returns null for a honeypot hit (nothing saved). */
  async create({ website, ...payload }, { userId = null, ip } = {}) {
    if (website) {
      logger.info('Enquiry honeypot triggered; dropped', { ip });
      return null;
    }

    const fields = { ...payload };
    if (fields.type === 'bulk') {
      // The hamper they asked about, so the email and the admin inbox can name it. Must be on sale.
      const hamper = fields.hamper ? await giftHamperService.findActive(fields.hamper) : null;
      if (fields.hamper && !hamper) throw ApiError.notFound('Gift hamper not found', { code: 'GIFT_HAMPER_NOT_FOUND' });
      if (hamper && !fields.subject) fields.subject = `Bulk order: ${hamper.name}`;
    } else {
      // A Contact Us message never carries the bulk fields, even if a client sends them.
      BULK_FIELDS.forEach((field) => delete fields[field]);
    }

    const enquiry = await Enquiry.create({ ...fields, user: userId, ip });
    await enquiry.populate('hamper', 'name code');
    await sendEnquiryEmails(enquiry);
    return enquiry;
  },

  async list(query) {
    const { page, limit, skip } = getPagination(query);
    const filter = {};

    if (query.status) filter.status = query.status;
    // Messages saved before bulk enquiries existed have no type, and are contact messages.
    if (query.type === 'bulk') filter.type = 'bulk';
    if (query.type === 'contact') filter.type = { $ne: 'bulk' };
    if (query.search) {
      const term = { $regex: escapeRegex(query.search), $options: 'i' };
      filter.$or = [{ name: term }, { email: term }, { subject: term }, { message: term }, { company: term }];
    }

    const [items, total] = await Promise.all([
      Enquiry.find(filter)
        .sort(ENQUIRY_SORT_MAP[query.sort] ?? ENQUIRY_SORT_MAP.newest)
        .skip(skip)
        .limit(limit)
        .populate('hamper', 'name code'),
      Enquiry.countDocuments(filter),
    ]);

    return { items, meta: buildMeta({ page, limit, total }) };
  },

  /** Admin detail. Opening a new enquiry marks it read. */
  async getById(id) {
    const enquiry = await Enquiry.findById(id).populate('user', 'name email phone').populate('hamper', 'name code');
    if (!enquiry) throw ApiError.notFound('Enquiry not found');

    if (enquiry.status === 'new') {
      enquiry.status = 'read';
      await enquiry.save();
    }
    return enquiry;
  },

  async update(id, { status }) {
    const enquiry = await Enquiry.findByIdAndUpdate(id, { status }, { returnDocument: 'after', runValidators: true });
    if (!enquiry) throw ApiError.notFound('Enquiry not found');
    return enquiry;
  },
};

export default enquiryService;