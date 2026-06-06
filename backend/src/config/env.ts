import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const durationPattern = /^\d+(ms|s|m|h|d)$/;

const durationUnits = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000
} as const;

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1),
  ACCESS_TOKEN_SECRET: z.string().optional(),
  REFRESH_TOKEN_SECRET: z.string().optional(),
  ACCESS_TOKEN_EXPIRES_IN: z.string().regex(durationPattern).default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().regex(durationPattern).default('7d'),
  CLIENT_URL: z.string().default('http://localhost:4200')
});

const parsedEnv = envSchema.parse(process.env);
const isProduction = parsedEnv.NODE_ENV === 'production';

const requiredSecret = (key: 'ACCESS_TOKEN_SECRET' | 'REFRESH_TOKEN_SECRET', fallback: string): string => {
  const value = parsedEnv[key] ?? (isProduction ? undefined : fallback);

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  if (isProduction && value.length < 32) {
    throw new Error(`${key} must be at least 32 characters in production.`);
  }

  return value;
};

const parseDurationMs = (value: string): number => {
  const match = value.match(/^(\d+)(ms|s|m|h|d)$/);

  if (!match) {
    throw new Error(`Invalid duration value: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2] as keyof typeof durationUnits;

  return amount * durationUnits[unit];
};

const accessTokenSecret = requiredSecret(
  'ACCESS_TOKEN_SECRET',
  'local-development-access-token-secret-change-me'
);
const refreshTokenSecret = requiredSecret(
  'REFRESH_TOKEN_SECRET',
  'local-development-refresh-token-secret-change-me'
);

if (isProduction && accessTokenSecret === refreshTokenSecret) {
  throw new Error('ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be different in production.');
}

if (isProduction && !parsedEnv.MONGODB_URI.startsWith('mongodb+srv://')) {
  throw new Error('MONGODB_URI must use a MongoDB Atlas SRV connection in production.');
}

export const env = {
  nodeEnv: parsedEnv.NODE_ENV,
  port: parsedEnv.PORT,
  mongoUri: parsedEnv.MONGODB_URI,
  accessTokenSecret,
  refreshTokenSecret,
  accessTokenExpiresIn: parsedEnv.ACCESS_TOKEN_EXPIRES_IN,
  refreshTokenExpiresIn: parsedEnv.REFRESH_TOKEN_EXPIRES_IN,
  accessTokenMaxAgeMs: parseDurationMs(parsedEnv.ACCESS_TOKEN_EXPIRES_IN),
  refreshTokenMaxAgeMs: parseDurationMs(parsedEnv.REFRESH_TOKEN_EXPIRES_IN),
  accessTokenCookieName: 'access_token',
  refreshTokenCookieName: 'refresh_token',
  cookieSecure: isProduction,
  clientUrl: parsedEnv.CLIENT_URL
};
