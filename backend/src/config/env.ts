import dotenv from 'dotenv';

dotenv.config();

const requiredEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  mongoUri: requiredEnv('MONGODB_URI', 'mongodb://127.0.0.1:27017/task_management_mean'),
  jwtSecret: requiredEnv('JWT_SECRET', 'change-this-secret-before-production'),
  jwtExpiresIn: requiredEnv('JWT_EXPIRES_IN', '1d'),
  clientUrl: requiredEnv('CLIENT_URL', 'http://localhost:4200')
};

