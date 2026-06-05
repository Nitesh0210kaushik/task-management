import type { Server } from 'socket.io';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { createTaskSchema, taskQuerySchema, updateTaskSchema } from '../schemas/task.schema';
import { canAssignTaskTo, canManageTask, getTaskVisibilityQuery } from '../services/permission.service';
import { emitTaskChange } from '../realtime/taskEvents';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';
import { sendResponse } from '../utils/sendResponse';

const populateTask = () => [
  { path: 'createdBy', select: 'username email role teamLeadId' },
  { path: 'assignedTo', select: 'username email role teamLeadId' }
];

const getSocketServer = (req: Parameters<Parameters<typeof asyncHandler>[0]>[0]): Server | undefined => {
  return req.app.get('io') as Server | undefined;
};

export const listTasks = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new HttpError(401, 'Authentication is required.');
  }

  const query = taskQuerySchema.parse(req.query);
  const visibilityQuery = await getTaskVisibilityQuery(req.user);
  const tasks = await Task.find({
    ...visibilityQuery,
    ...(query.status ? { status: query.status } : {})
  })
    .populate(populateTask())
    .sort({ updatedAt: -1 });

  sendResponse(res, 200, tasks);
});

export const createTask = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new HttpError(401, 'Authentication is required.');
  }

  const payload = createTaskSchema.parse(req.body);
  const assignedTo = req.user.role === 'employee' ? req.user.id : payload.assignedTo ?? req.user.id;

  if (!(await canAssignTaskTo(req.user, assignedTo))) {
    throw new HttpError(403, 'You cannot assign a task to this user.');
  }

  const assignee = await User.findById(assignedTo);

  if (!assignee) {
    throw new HttpError(404, 'Assigned user not found.');
  }

  const task = await Task.create({
    title: payload.title,
    description: payload.description,
    status: payload.status,
    createdBy: req.user.id,
    assignedTo
  });

  await emitTaskChange(getSocketServer(req), 'task:created', task);
  const populatedTask = await task.populate(populateTask());

  sendResponse(res, 201, populatedTask, 'Task created successfully.');
});

export const updateTask = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new HttpError(401, 'Authentication is required.');
  }

  const payload = updateTaskSchema.parse(req.body);
  const task = await Task.findById(req.params.id);

  if (!task) {
    throw new HttpError(404, 'Task not found.');
  }

  if (!(await canManageTask(req.user, task))) {
    throw new HttpError(403, 'You cannot modify this task.');
  }

  if (payload.assignedTo) {
    if (req.user.role === 'employee') {
      throw new HttpError(403, 'Employees cannot reassign tasks.');
    }

    if (!(await canAssignTaskTo(req.user, payload.assignedTo))) {
      throw new HttpError(403, 'You cannot assign a task to this user.');
    }

    task.assignedTo = payload.assignedTo as unknown as typeof task.assignedTo;
  }

  if (payload.title !== undefined) {
    task.title = payload.title;
  }

  if (payload.description !== undefined) {
    task.description = payload.description;
  }

  if (payload.status !== undefined) {
    task.status = payload.status;
  }

  await task.save();
  await emitTaskChange(getSocketServer(req), 'task:updated', task);
  const populatedTask = await task.populate(populateTask());

  sendResponse(res, 200, populatedTask, 'Task updated successfully.');
});

export const deleteTask = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new HttpError(401, 'Authentication is required.');
  }

  const task = await Task.findById(req.params.id);

  if (!task) {
    throw new HttpError(404, 'Task not found.');
  }

  if (!(await canManageTask(req.user, task))) {
    throw new HttpError(403, 'You cannot delete this task.');
  }

  await task.deleteOne();
  await emitTaskChange(getSocketServer(req), 'task:deleted', task);

  sendResponse(res, 200, { id: req.params.id }, 'Task deleted successfully.');
});

