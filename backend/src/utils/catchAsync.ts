import type { NextFunction, Request, RequestHandler, Response } from 'express';

type AsyncController = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export const catchAsync = (controller: AsyncController): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    controller(req, res, next).catch(next);
  };
};

