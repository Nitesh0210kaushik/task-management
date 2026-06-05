import type { Request, Response } from 'express';
import type { Server } from 'socket.io';
import { HTTP_STATUS } from '../../../constants/http';
import { ApiError } from '../../../utils/ApiError';
import { apiResponse } from '../../../utils/ApiResponse';
import { catchAsync } from '../../../utils/catchAsync';
import { TaskService } from '../services/task.service';
import { createTaskSchema, taskQuerySchema, updateTaskSchema } from '../validations/task.validation';

const taskService = new TaskService();

const getSocketServer = (req: Request): Server | undefined => {
  return req.app.get('io') as Server | undefined;
};

const getRouteParam = (value: string | string[]): string => {
  return Array.isArray(value) ? value[0] : value;
};

export const listTasks = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication is required.');
  }

  const query = taskQuerySchema.parse(req.query);
  const tasks = await taskService.listTasks(req.user, query);

  apiResponse(res, HTTP_STATUS.OK, tasks);
});

export const createTask = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication is required.');
  }

  const payload = createTaskSchema.parse(req.body);
  const task = await taskService.createTask(req.user, payload, getSocketServer(req));

  apiResponse(res, HTTP_STATUS.CREATED, task, 'Task created successfully.');
});

export const updateTask = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication is required.');
  }

  const payload = updateTaskSchema.parse(req.body);
  const task = await taskService.updateTask(req.user, getRouteParam(req.params.id), payload, getSocketServer(req));

  apiResponse(res, HTTP_STATUS.OK, task, 'Task updated successfully.');
});

export const deleteTask = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication is required.');
  }

  const result = await taskService.deleteTask(req.user, getRouteParam(req.params.id), getSocketServer(req));

  apiResponse(res, HTTP_STATUS.OK, result, 'Task deleted successfully.');
});
