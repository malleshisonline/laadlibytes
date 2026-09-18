import { z } from 'zod';

import { DEFAULT_LOW_STOCK_THRESHOLD } from './admin.service.js';

export const adminSummaryQuerySchema = z.object({
  // "Running low" is a judgement call, so the dashboard may set its own line.
  lowStockThreshold: z.coerce.number().int().min(1).max(1000).default(DEFAULT_LOW_STOCK_THRESHOLD),
});

export default adminSummaryQuerySchema;