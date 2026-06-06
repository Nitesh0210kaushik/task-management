import type { Server } from 'socket.io';
import type { AuthUser } from '../modules/auth/types/auth.types';
import { User } from '../modules/users/models/user.model';
import type { ITask } from '../modules/tasks/models/task.model';
import { NotificationService } from '../modules/notifications/services/notification.service';

export type TaskRealtimeEvent = 'task:created' | 'task:updated' | 'task:deleted';

const notificationService = new NotificationService();

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

export const emitTaskChange = async (
  io: Server | undefined,
  event: TaskRealtimeEvent,
  task: ITask,
  actor?: AuthUser
): Promise<void> => {
  const roomNames = new Set<string>(['role:manager']);
  const createdById = getReferenceId(task.createdBy);
  const assignedToId = getReferenceId(task.assignedTo);
  const userIds = [createdById, assignedToId].filter((id): id is string => Boolean(id));
  const recipientIds = new Set<string>(userIds);

  userIds.forEach((userId) => {
    roomNames.add(`user:${userId}`);
  });

  const managers = await User.find({ role: 'manager' }).select('_id');
  managers.forEach((manager) => {
    recipientIds.add(manager.id);
  });

  const relatedUsers = await User.find({
    _id: { $in: userIds }
  }).select('teamLeadId');

  relatedUsers.forEach((user) => {
    if (user.teamLeadId) {
      const teamLeadId = user.teamLeadId.toString();
      roomNames.add(`user:${teamLeadId}`);
      recipientIds.add(teamLeadId);
    }
  });

  const notifications = await notificationService.createTaskNotifications({
    event,
    task,
    recipientIds: [...recipientIds],
    actor
  });

  if (!io) {
    return;
  }

  const payload = {
    event,
    taskId: task.id,
    task
  };

  roomNames.forEach((roomName) => {
    io.to(roomName).emit(event, payload);
  });

  notifications.forEach((notification) => {
    const notificationPayload = notificationService.toResponse(notification);
    io.to(`user:${notificationPayload.recipient}`).emit('notification:new', notificationPayload);
  });
};
