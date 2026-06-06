import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express, { type NextFunction, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { HTTP_STATUS } from './constants/http';
import { env } from './config/env';
import { loggerStream } from './config/logger';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.middleware';
import { registerApiRoutes } from './routes';
import { ApiError } from './utils/ApiError';

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const parseOrigin = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
};

const csrfOriginGuard = (req: Request, _res: Response, next: NextFunction): void => {
  if (!unsafeMethods.has(req.method)) {
    next();
    return;
  }

  const originHeader = req.get('origin');
  const refererHeader = req.get('referer');

  if (!originHeader && !refererHeader) {
    next();
    return;
  }

  const requestOrigin = parseOrigin(req.get('host') ? `${req.protocol}://${req.get('host')}` : undefined);
  const allowedOrigins = new Set([parseOrigin(env.clientUrl), requestOrigin].filter((origin): origin is string => Boolean(origin)));
  const sourceOrigin = parseOrigin(originHeader ?? refererHeader);

  if (!sourceOrigin || !allowedOrigins.has(sourceOrigin)) {
    next(new ApiError(HTTP_STATUS.FORBIDDEN, 'Invalid request origin.'));
    return;
  }

  next();
};

export const createApp = () => {
  const app = express();

  app.disable('etag');

  if (env.nodeEnv === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(
    helmet({
      crossOriginResourcePolicy: false
    })
  );
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev', { stream: loggerStream }));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    standardHeaders: true,
    legacyHeaders: false
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', apiLimiter, csrfOriginGuard, (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  registerApiRoutes(app, authLimiter);

  // Serve frontend built static files
  const frontendPath = path.join(__dirname, '../../frontend/dist/task-management-frontend/browser');
  app.use(express.static(frontendPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
