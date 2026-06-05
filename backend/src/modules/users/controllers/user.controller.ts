import type { Request, Response } from 'express';
import { HTTP_STATUS } from '../../../constants/http';
import { ApiError } from '../../../utils/ApiError';
import { apiResponse } from '../../../utils/ApiResponse';
import { catchAsync } from '../../../utils/catchAsync';
import { UserService } from '../services/user.service';
import { assignTeamLeadSchema, createUserSchema } from '../validations/user.validation';

const userService = new UserService();

const getRouteParam = (value: string | string[]): string => {
  return Array.isArray(value) ? value[0] : value;
};

export const listUsers = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication is required.');
  }

  const users = await userService.listVisibleUsers(req.user);
  apiResponse(res, HTTP_STATUS.OK, users);
});

export const createUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication is required.');
  }

  const payload = createUserSchema.parse(req.body);
  const user = await userService.createUser(req.user, payload);

  apiResponse(res, HTTP_STATUS.CREATED, user, 'Team lead created successfully.');
});

export const assignTeamLead = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication is required.');
  }

  const payload = assignTeamLeadSchema.parse(req.body);
  const employee = await userService.assignTeamLead(req.user, getRouteParam(req.params.id), payload);

  apiResponse(res, HTTP_STATUS.OK, employee, 'Team lead assignment updated.');
});
