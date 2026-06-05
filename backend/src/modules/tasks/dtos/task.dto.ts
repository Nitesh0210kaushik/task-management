import type { TaskStatus } from '../../../constants/task-status';

export interface CreateTaskDto {
  title: string;
  description: string;
  status: TaskStatus;
  assignedTo?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  assignedTo?: string;
}

export interface TaskQueryDto {
  status?: TaskStatus;
}

