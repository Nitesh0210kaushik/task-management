import { Types } from 'mongoose';
import { HTTP_STATUS } from '../../../constants/http';
import type { TaskStatus } from '../../../constants/task-status';
import type { TaskRealtimeEvent } from '../../../realtime/taskEvents';
import { ApiError } from '../../../utils/ApiError';
import type { AuthUser } from '../../auth/types/auth.types';
import type { ITask } from '../../tasks/models/task.model';
import type { DeleteNotificationsResultDto, MarkNotificationsReadResultDto, NotificationResponseDto } from '../dtos/notification.dto';
import { type INotification } from '../models/notification.model';
import { NotificationRepository } from '../repositories/notification.repository';

interface CreateTaskNotificationsInput {
  event: TaskRealtimeEvent;
  task: ITask;
  recipientIds: string[];
  actor?: AuthUser;
}

const getReferenceId = (reference: unknown): string | null => {
  if (!reference) {
    return null;
  }

  if (typeof reference === 'string') {
    return reference;
  }

  if (typeof reference === 'object') {
    const hexString = (reference as { toHexString?: () => string }).toHexString;

    if (typeof hexString === 'function') {
      return hexString.call(reference);
    }

    const record = reference as { id?: unknown; _id?: unknown; toString?: () => string };
    const nestedId = record._id ?? (typeof record.id === 'string' ? record.id : undefined);

    if (nestedId) {
      return getReferenceId(nestedId);
    }

    if (typeof record.toString === 'function') {
      return record.toString();
    }
  }

  return String(reference);
};

const getReferenceUsername = (reference: unknown, fallback: string): string => {
  if (reference && typeof reference === 'object') {
    const username = (reference as { username?: unknown }).username;
    return typeof username === 'string' && username.trim() ? username : fallback;
  }

  return fallback;
};

export class NotificationService {
  private readonly notificationRepository = new NotificationRepository();

  listNotifications(currentUser: AuthUser): Promise<INotification[]> {
    return this.notificationRepository.findByRecipient(currentUser.id);
  }

  async markAllRead(currentUser: AuthUser): Promise<MarkNotificationsReadResultDto> {
    const updatedCount = await this.notificationRepository.markAllRead(currentUser.id);
    return { updatedCount };
  }

  async markOneRead(currentUser: AuthUser, notificationId: string): Promise<INotification> {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Notification not found.');
    }

    const notification = await this.notificationRepository.markOneRead(currentUser.id, notificationId);

    if (!notification) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Notification not found.');
    }

    return notification;
  }

  async deleteNotification(currentUser: AuthUser, notificationId: string): Promise<{ id: string; isDeleted: boolean }> {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Notification not found.');
    }

    const notification = await this.notificationRepository.softDelete(currentUser.id, notificationId);

    if (!notification) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Notification not found.');
    }

    return {
      id: notificationId,
      isDeleted: true
    };
  }

  async deleteAllNotifications(currentUser: AuthUser): Promise<DeleteNotificationsResultDto> {
    const deletedCount = await this.notificationRepository.softDeleteAll(currentUser.id);
    return { deletedCount };
  }

  async createTaskNotifications(input: CreateTaskNotificationsInput): Promise<INotification[]> {
    const uniqueRecipientIds = [...new Set(input.recipientIds)].filter((recipientId) => Types.ObjectId.isValid(recipientId));

    if (!uniqueRecipientIds.length) {
      return [];
    }

    const taskId = getReferenceId(input.task._id);
    const actorId = input.actor?.id;

    if (!taskId || !Types.ObjectId.isValid(taskId)) {
      return [];
    }

    const notificationContent = this.buildTaskNotificationContent(input.event, input.task, input.actor);

    return this.notificationRepository.createMany(
      uniqueRecipientIds.map((recipientId) => ({
        recipient: new Types.ObjectId(recipientId),
        actor: actorId && Types.ObjectId.isValid(actorId) ? new Types.ObjectId(actorId) : null,
        taskId: new Types.ObjectId(taskId),
        event: input.event,
        title: notificationContent.title,
        message: notificationContent.message,
        status: notificationContent.status
      }))
    );
  }

  toResponse(notification: INotification): NotificationResponseDto {
    return notification.toJSON() as unknown as NotificationResponseDto;
  }

  private buildTaskNotificationContent(
    event: TaskRealtimeEvent,
    task: ITask,
    actor?: AuthUser
  ): Pick<NotificationResponseDto, 'title' | 'message' | 'status'> {
    const taskTitle = task.title || 'Task';
    const actorName = actor?.username || getReferenceUsername(task.createdBy, 'workspace user');
    const ownerName = getReferenceUsername(task.assignedTo, 'assigned user');
    const status = this.normalizeStatusValue(task.status);

    const titles: Record<TaskRealtimeEvent, string> = {
      'task:created': 'Task created',
      'task:updated': 'Task updated',
      'task:deleted': 'Task deleted'
    };

    const messages: Record<TaskRealtimeEvent, string> = {
      'task:created': `${actorName} created "${taskTitle}" for ${ownerName}.`,
      'task:updated': `${actorName} updated "${taskTitle}" for ${ownerName}.`,
      'task:deleted': `${actorName} deleted "${taskTitle}".`
    };

    return {
      title: titles[event],
      message: messages[event],
      status
    };
  }

  private normalizeStatusValue(status: TaskStatus | string): TaskStatus {
    return status === 'pending' ? 'backlog' : (status as TaskStatus);
  }
}
