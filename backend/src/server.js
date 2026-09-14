import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/database.js';
import { logger } from './config/logger.js';

let server;

async function bootstrap() {
  await connectDB();

  server = app.listen(env.PORT, () => {
    logger.info(`Server listening on http://localhost:${env.PORT}${env.API_PREFIX} [${env.NODE_ENV}]`);
  });
}

/** Stop accepting connections, drain in-flight requests, then close the DB. */
async function shutdown(signal, exitCode = 0) {
  logger.info(`${signal} received, shutting down gracefully`);

  const forceExit = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 10_000).unref();

  try {
    if (server) await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
    await disconnectDB();
    clearTimeout(forceExit);
    process.exit(exitCode);
  } catch (err) {
    logger.error('Error during shutdown', err);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// An unhandled rejection or uncaught exception leaves the process in an unknown
// state — log it and restart rather than serving from a corrupted one.
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', reason instanceof Error ? reason : new Error(String(reason)));
  shutdown('unhandledRejection', 1);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', err);
  shutdown('uncaughtException', 1);
});

bootstrap().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
