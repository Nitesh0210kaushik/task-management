import type { Request, Response } from 'express';
import { HTTP_STATUS } from '../../../constants/http';
import { ApiError } from '../../../utils/ApiError';
import { apiResponse } from '../../../utils/ApiResponse';
import { catchAsync } from '../../../utils/catchAsync';
import { DashboardService } from '../services/dashboard.service';

const dashboardService = new DashboardService();

export const getDashboardOverview = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication is required.');
  }

  const overview = await dashboardService.getOverview(req.user);
  apiResponse(res, HTTP_STATUS.OK, overview);
});
