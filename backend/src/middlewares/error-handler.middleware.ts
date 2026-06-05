import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { HTTP_STATUS } from '../constants/http';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { ApiError } from '../utils/ApiError';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new ApiError(HTTP_STATUS.NOT_FOUND, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error?.type === 'entity.parse.failed') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Invalid JSON payload.'
    });
  }

  if (error instanceof ZodError) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Validation failed.',
      errors: error.flatten()
    });
  }

  if (error?.name === 'CastError') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Invalid resource id.'
    });
  }

  if (error?.code === 11000) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      message: 'A record with this unique value already exists.'
    });
  }

  const statusCode = error instanceof ApiError ? error.statusCode : HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = error instanceof ApiError ? error.message : 'Something went wrong.';

  if (!(error instanceof ApiError)) {
    logger.error('Unhandled request error', {
      method: req.method,
      path: req.originalUrl,
      error: error instanceof Error ? error.stack ?? error.message : error
    });
  }

  return res.status(statusCode).json({
    message,
    ...(error instanceof ApiError && error.details ? { details: error.details } : {}),
    ...(env.nodeEnv === 'development' && !(error instanceof ApiError) ? { stack: error.stack } : {})
  });
};
