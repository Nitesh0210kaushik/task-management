import type { NextFunction, Request, Response } from 'express';
import { User } from '../models/User';
import { verifyAuthToken } from '../utils/jwt';
import { HttpError } from '../utils/httpError';
import type { UserRole } from '../types/auth';

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new HttpError(401, 'Authentication token is required.');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAuthToken(token);
    const user = await User.findById(payload.sub);

    if (!user) {
      throw new HttpError(401, 'Authenticated user no longer exists.');
    }

    req.user = {
      id: user.id,
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      teamLeadId: user.teamLeadId
    };

    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, 'Invalid or expired authentication token.'));
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new HttpError(401, 'Authentication is required.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, 'You do not have permission to perform this action.'));
    }

    return next();
  };
};

