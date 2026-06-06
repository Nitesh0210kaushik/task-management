import type { Request, Response } from 'express';
import { HTTP_STATUS } from '../../../constants/http';
import { ApiError } from '../../../utils/ApiError';
import { apiResponse } from '../../../utils/ApiResponse';
import { catchAsync } from '../../../utils/catchAsync';
import { NotificationService } from '../services/notification.service';

const notificationService = new NotificationService();

const getRouteParam = (value: string | string[]): string => {
  return Array.isArray(value) ? value[0] : value;
};

export const listNotifications = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication is required.');
  }

  const notifications = await notificationService.listNotifications(req.user);
  apiResponse(res, HTTP_STATUS.OK, notifications.map((notification) => notificationService.toResponse(notification)));
});

export const markNotificationsRead = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication is required.');
  }

  const result = await notificationService.markAllRead(req.user);
  apiResponse(res, HTTP_STATUS.OK, result, 'Notifications marked as read.');
});

export const markNotificationRead = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication is required.');
  }

  const notification = await notificationService.markOneRead(req.user, getRouteParam(req.params.id));
  apiResponse(res, HTTP_STATUS.OK, notificationService.toResponse(notification), 'Notification marked as read.');
});

export const deleteNotification = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication is required.');
  }

  const result = await notificationService.deleteNotification(req.user, getRouteParam(req.params.id));
  apiResponse(res, HTTP_STATUS.OK, result, 'Notification deleted successfully.');
});
