import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';

import { env } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { httpLogger, requestId } from './middlewares/requestContext.js';
import { sanitizeRequest, sanitizedQueryParser } from './middlewares/sanitize.js';
import apiRoutes from './routes/index.js';

const app = express();

// Behind a load balancer / reverse proxy, so req.ip and secure cookies work.
app.set('trust proxy', 1);
app.set('query parser', sanitizedQueryParser);
app.disable('x-powered-by');

// --- Security & parsing -----------------------------------------------------
app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(hpp());
app.use(sanitizeRequest);
app.use(compression());

// --- Observability ----------------------------------------------------------
app.use(requestId);
app.use(httpLogger);

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: `Server is running on port ${env.PORT}`,
  });
});

// --- Routes -----------------------------------------------------------------
app.use(env.API_PREFIX, apiLimiter, apiRoutes);

// --- Fallbacks (must stay last) ---------------------------------------------
app.use(notFound);
app.use(errorHandler);

export default app;
