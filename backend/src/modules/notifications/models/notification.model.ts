import { Schema, model, type Document, type Types } from 'mongoose';
import { TASK_STATUS_VALUES_WITH_LEGACY, type TaskStatus } from '../../../constants/task-status';
import type { TaskRealtimeEvent } from '../../../realtime/taskEvents';

export const NOTIFICATION_EVENTS: TaskRealtimeEvent[] = ['task:created', 'task:updated', 'task:deleted'];

export interface INotification extends Document {
  recipient: Types.ObjectId;
  actor?: Types.ObjectId | null;
  taskId: Types.ObjectId;
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

const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true
    },
    event: {
      type: String,
      enum: NOTIFICATION_EVENTS,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    status: {
      type: String,
      enum: TASK_STATUS_VALUES_WITH_LEGACY,
      required: true
    },
    read: {
      type: Boolean,
      default: false,
      required: true
    },
    readAt: {
      type: Date,
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false,
      required: true
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        const output = ret as Record<string, unknown>;
        delete output['__v'];
        output['id'] = String(output['_id']);
        output['recipient'] = String(output['recipient']);
        output['taskId'] = String(output['taskId']);

        if (output['actor']) {
          output['actor'] = String(output['actor']);
        }

        delete output['_id'];
        return ret;
      }
    }
  }
);

notificationSchema.index({ recipient: 1, isDeleted: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isDeleted: 1, read: 1 });
notificationSchema.index({ taskId: 1 });

export const Notification = model<INotification>('Notification', notificationSchema);
