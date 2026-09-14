import { randomUUID } from 'node:crypto';

import morgan from 'morgan';

import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/** Gives every request a correlation id, echoed back on the response and in every log line. */
export const requestId = (req, res, next) => {
  req.id = req.headers['x-request-id'] || randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
};

morgan.token('id', (req) => req.id);

export const httpLogger = morgan(
  env.isDev ? ':method :url :status :response-time ms' : ':id :remote-addr :method :url :status :res[content-length] :response-time ms',
  { stream: logger.stream, skip: () => env.isTest }
);
