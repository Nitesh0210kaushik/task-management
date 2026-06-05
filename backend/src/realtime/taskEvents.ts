import type { Server } from 'socket.io';
import { User } from '../modules/users/models/user.model';
import type { ITask } from '../modules/tasks/models/task.model';

export type TaskRealtimeEvent = 'task:created' | 'task:updated' | 'task:deleted';

const getReferenceId = (reference: unknown): string | null => {
  if (!reference) {
    return null;
  }

  if (typeof reference === 'string') {
    return reference;
  }

  if (typeof reference === 'object') {
    const record = reference as { id?: unknown; _id?: unknown; toString?: () => string };
    const nestedId = record.id ?? record._id;

    if (nestedId) {
      return getReferenceId(nestedId);
    }

    if (typeof record.toString === 'function') {
      return record.toString();
    }
  }

  return String(reference);
};

export const emitTaskChange = async (io: Server | undefined, event: TaskRealtimeEvent, task: ITask): Promise<void> => {
  if (!io) {
    return;
  }

  const roomNames = new Set<string>(['role:manager']);
  const createdById = getReferenceId(task.createdBy);
  const assignedToId = getReferenceId(task.assignedTo);
  const userIds = [createdById, assignedToId].filter((id): id is string => Boolean(id));

  userIds.forEach((userId) => {
    roomNames.add(`user:${userId}`);
  });

  const relatedUsers = await User.find({
    _id: { $in: userIds }
  }).select('teamLeadId');

  relatedUsers.forEach((user) => {
    if (user.teamLeadId) {
      roomNames.add(`user:${user.teamLeadId.toString()}`);
    }
  });

  const payload = {
    event,
    taskId: task.id,
    task
  };

  roomNames.forEach((roomName) => {
    io.to(roomName).emit(event, payload);
  });
};
