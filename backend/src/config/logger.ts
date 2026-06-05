import winston from 'winston';
import { env } from './env';

const isProduction = env.nodeEnv === 'production';

const devFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const details = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';

    return `[${timestamp}] ${level} ${stack ?? message}${details}`;
  })
);

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: isProduction ? prodFormat : devFormat,
  transports: [new winston.transports.Console()],
  exitOnError: false
});

export const loggerStream = {
  write: (message: string): void => {
    logger.info(message.trim());
  }
};
