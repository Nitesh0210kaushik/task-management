import { Types } from 'mongoose';
import type { Server } from 'socket.io';
import { HTTP_STATUS } from '../../../constants/http';
import { USER_ROLES } from '../../../constants/roles';
import { ApiError } from '../../../utils/ApiError';
import type { AuthUser } from '../../auth/types/auth.types';
import { UserRepository } from '../../users/repositories/user.repository';
import { PermissionService } from '../../users/services/permission.service';
import { emitTaskChange } from '../../../realtime/taskEvents';
import type { CreateTaskDto, TaskQueryDto, UpdateTaskDto } from '../dtos/task.dto';
import type { ITask } from '../models/task.model';
import { TaskRepository } from '../repositories/task.repository';

interface DeleteTaskResult {
  id: string;
  isDeleted: boolean;
}

export class TaskService {
  private readonly taskRepository = new TaskRepository();
  private readonly userRepository = new UserRepository();
  private readonly permissionService = new PermissionService();

  async listTasks(currentUser: AuthUser, query: TaskQueryDto): Promise<ITask[]> {
    let visibilityQuery = await this.permissionService.getTaskVisibilityQuery(currentUser);

    if (query.search) {
      const escapedSearch = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');
      const matchingUsers = await this.userRepository.findBySearchTerm(query.search);
      const matchingUserIds = matchingUsers.map((user) => user._id);
      const searchQuery = {
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { createdBy: { $in: matchingUserIds } },
          { assignedTo: { $in: matchingUserIds } }
        ]
      };

      visibilityQuery = Object.keys(visibilityQuery).length ? { $and: [visibilityQuery, searchQuery] } : searchQuery;
    }

    return this.taskRepository.findVisible(visibilityQuery, query.status);
  }

  async createTask(currentUser: AuthUser, payload: CreateTaskDto, io?: Server): Promise<ITask> {
    const assignedTo = currentUser.role === USER_ROLES.EMPLOYEE ? currentUser.id : payload.assignedTo ?? currentUser.id;

    if (!(await this.permissionService.canAssignTaskTo(currentUser, assignedTo))) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You cannot assign a task to this user.');
    }

    const assignee = await this.userRepository.findById(assignedTo);

    if (!assignee) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Assigned user not found.');
    }

    const task = await this.taskRepository.create({
      title: payload.title,
      description: payload.description,
      status: payload.status,
      createdBy: currentUser.id,
      assignedTo
    });

    const populatedTask = await this.taskRepository.populate(task);
    await emitTaskChange(io, 'task:created', populatedTask, currentUser);

    return populatedTask;
  }

  async updateTask(currentUser: AuthUser, taskId: string, payload: UpdateTaskDto, io?: Server): Promise<ITask> {
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Task not found.');
    }

    if (!(await this.permissionService.canManageTask(currentUser, task))) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You cannot modify this task.');
    }

    if (payload.assignedTo) {
      if (currentUser.role === USER_ROLES.EMPLOYEE) {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Employees cannot reassign tasks.');
      }

      if (!(await this.permissionService.canAssignTaskTo(currentUser, payload.assignedTo))) {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You cannot assign a task to this user.');
      }

      task.assignedTo = new Types.ObjectId(payload.assignedTo);
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
    const populatedTask = await this.taskRepository.populate(task);
    await emitTaskChange(io, 'task:updated', populatedTask, currentUser);

    return populatedTask;
  }

  async deleteTask(currentUser: AuthUser, taskId: string, io?: Server): Promise<DeleteTaskResult> {
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Task not found.');
    }

    if (!(await this.permissionService.canManageTask(currentUser, task))) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You cannot delete this task.');
    }

    await this.taskRepository.softDelete(task);
    const populatedTask = await this.taskRepository.populate(task);
    await emitTaskChange(io, 'task:deleted', populatedTask, currentUser);

    return { id: taskId, isDeleted: true };
  }
}
