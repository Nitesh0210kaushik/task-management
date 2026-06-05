import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

export const connectDatabase = async (): Promise<void> => {
  mongoose.set('strictQuery', true);

  const connection = await mongoose.connect(env.mongoUri, {
    autoIndex: env.nodeEnv !== 'production'
  });
  const { host, port, name } = connection.connection;

  logger.info(`MongoDB connected: ${host}:${port}/${name}`);
};
