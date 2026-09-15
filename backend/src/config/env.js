import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

// Load .env.<NODE_ENV> first (if present), then fall back to .env for the rest.
dotenv.config({ path: path.join(rootDir, `.env.${process.env.NODE_ENV}`), quiet: true });
dotenv.config({ path: path.join(rootDir, '.env'), quiet: true });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  API_PREFIX: z.string().startsWith('/').default('/api'),

  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(8).max(15).default(10),

  // HMAC key for stored OTP hashes.
  OTP_SECRET: z.string().min(32, 'OTP_SECRET must be at least 32 characters'),

  // "console" only logs messages (development); real providers need the credentials below.
  EMAIL_PROVIDER: z.enum(['console', 'smtp']).default('console'),
  SMTP_URL: z.string().trim().optional(),
  EMAIL_FROM: z.string().trim().optional(),

  SMS_PROVIDER: z.enum(['console', 'msg91']).default('console'),
  MSG91_AUTH_KEY: z.string().trim().optional(),
  MSG91_OTP_TEMPLATE_ID: z.string().trim().optional(),

  // Comma-separated list, or "*" to allow any origin.
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
}).superRefine((cfg, ctx) => {
  const requireFor = (provider, names) => {
    for (const name of names) {
      if (!cfg[name]) ctx.addIssue({ code: 'custom', path: [name], message: `${name} is required when ${provider}` });
    }
  };

  if (cfg.EMAIL_PROVIDER === 'smtp') requireFor('EMAIL_PROVIDER=smtp', ['SMTP_URL', 'EMAIL_FROM']);
  if (cfg.SMS_PROVIDER === 'msg91') requireFor('SMS_PROVIDER=msg91', ['MSG91_AUTH_KEY', 'MSG91_OTP_TEMPLATE_ID']);

  // The console drivers only log codes; nobody would ever receive them.
  if (cfg.NODE_ENV === 'production') {
    for (const name of ['EMAIL_PROVIDER', 'SMS_PROVIDER']) {
      if (cfg[name] === 'console') {
        ctx.addIssue({ code: 'custom', path: [name], message: `${name}=console is not allowed in production` });
      }
    }
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  // Logger depends on env, so this one case has to use console.
  console.error(`\nInvalid environment configuration:\n${details}\n`);
  process.exit(1);
}

const raw = parsed.data;

export const env = Object.freeze({
  ...raw,
  isDev: raw.NODE_ENV === 'development',
  isTest: raw.NODE_ENV === 'test',
  isProd: raw.NODE_ENV === 'production',
  corsOrigins: raw.CORS_ORIGIN === '*' ? '*' : raw.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean),
});

export default env;
