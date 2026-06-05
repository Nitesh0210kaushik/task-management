import type { Server } from 'socket.io';
import { User } from '../models/User';
import type { ITask } from '../models/Task';

export type TaskRealtimeEvent = 'task:created' | 'task:updated' | 'task:deleted';

export const emitTaskChange = async (io: Server | undefined, event: TaskRealtimeEvent, task: ITask): Promise<void> => {
  if (!io) {
    return;
  }

  const roomNames = new Set<string>(['role:manager']);
  roomNames.add(`user:${task.createdBy.toString()}`);
  roomNames.add(`user:${task.assignedTo.toString()}`);

  const relatedUsers = await User.find({
    _id: { $in: [task.createdBy, task.assignedTo] }
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

