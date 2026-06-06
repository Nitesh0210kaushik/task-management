import type { TaskStatus } from '../../../constants/task-status';
import type { TaskRealtimeEvent } from '../../../realtime/taskEvents';

export interface NotificationResponseDto {
  id: string;
  recipient: string;
  actor?: string | null;
  taskId: string;
  event: TaskRealtimeEvent;
  title: string;
  message: string;
  status: TaskStatus;
  read: boolean;
  readAt?: Date | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarkNotificationsReadResultDto {
  updatedCount: number;
}

export interface DeleteNotificationsResultDto {
  deletedCount: number;
}
