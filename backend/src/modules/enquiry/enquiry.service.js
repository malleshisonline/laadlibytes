import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { sendEmail } from '../../integrations/email/index.js';
import { enquiryAcknowledgementEmail } from '../../templates/email/enquiryAcknowledgement.js';
import { enquiryReceivedEmail } from '../../templates/email/enquiryReceived.js';
import { ApiError } from '../../utils/ApiError.js';
import { buildMeta, getPagination } from '../../utils/pagination.js';

import { Enquiry } from './enquiry.model.js';

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

    const enquiry = await Enquiry.create({ ...payload, user: userId, ip });
    await sendEnquiryEmails(enquiry);
    return enquiry;
  },

  async list(query) {
    const { page, limit, skip } = getPagination(query);
    const filter = {};

    if (query.status) filter.status = query.status;
    if (query.search) {
      const term = { $regex: escapeRegex(query.search), $options: 'i' };
      filter.$or = [{ name: term }, { email: term }, { subject: term }, { message: term }];
    }

    const [items, total] = await Promise.all([
      Enquiry.find(filter)
        .sort(ENQUIRY_SORT_MAP[query.sort] ?? ENQUIRY_SORT_MAP.newest)
        .skip(skip)
        .limit(limit),
      Enquiry.countDocuments(filter),
    ]);

    return { items, meta: buildMeta({ page, limit, total }) };
  },

  /** Admin detail. Opening a new enquiry marks it read. */
  async getById(id) {
    const enquiry = await Enquiry.findById(id).populate('user', 'name email phone');
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