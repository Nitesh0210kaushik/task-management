import type { Response } from 'express';

export const sendResponse = <T>(res: Response, statusCode: number, data: T, message?: string): void => {
  res.status(statusCode).json({
    data,
    ...(message ? { message } : {})
  });
};

