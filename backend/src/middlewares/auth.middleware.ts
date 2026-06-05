import type { NextFunction, Request, Response } from 'express';
import { HTTP_STATUS } from '../constants/http';
import { User } from '../modules/users/models/user.model';
import { getAccessTokenFromRequest } from '../modules/auth/utils/cookie.util';
import { verifyAccessToken } from '../modules/auth/utils/jwt.util';
import { ApiError } from '../utils/ApiError';
import type { UserRole } from '../constants/roles';

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = getAccessTokenFromRequest(req);

    if (!token) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication token is required.');
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);

    if (!user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authenticated user no longer exists.');
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
    next(
      error instanceof ApiError
        ? error
        : new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid or expired authentication token.')
    );
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication is required.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(HTTP_STATUS.FORBIDDEN, 'You do not have permission to perform this action.'));
    }

    return next();
  };
};
