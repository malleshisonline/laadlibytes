import mongoose from 'mongoose';

import { env } from './env.js';
import { logger } from './logger.js';

mongoose.set('strictQuery', true);

if (env.isDev) {
  mongoose.set('debug', (collection, method, query) =>
    logger.debug(`mongo: ${collection}.${method} ${JSON.stringify(query)}`)
  );
}

export async function connectDB(uri = env.MONGO_URI) {
  mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('error', (err) => logger.error('MongoDB connection error', err));

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 45_000,
    maxPoolSize: 10,
    minPoolSize: 1,
    autoIndex: !env.isProd, // build indexes yourself in prod; it blocks writes
  });

  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.connection.close(false);
  logger.info('MongoDB connection closed');
}

export default connectDB;
