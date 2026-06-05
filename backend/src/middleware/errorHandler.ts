import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { HttpError } from '../utils/httpError';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed.',
      errors: error.flatten()
    });
  }

  if (error?.code === 11000) {
    return res.status(409).json({
      message: 'A record with this unique value already exists.'
    });
  }

  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  const message = error instanceof HttpError ? error.message : 'Something went wrong.';

  return res.status(statusCode).json({
    message,
    ...(error instanceof HttpError && error.details ? { details: error.details } : {}),
    ...(env.nodeEnv === 'development' && !(error instanceof HttpError) ? { stack: error.stack } : {})
  });
};

