import { Schema, model, type Document, type Types } from 'mongoose';
import { TASK_STATUSES, TASK_STATUS_VALUES_WITH_LEGACY, type TaskStatus } from '../../../constants/task-status';

export interface ITask extends Document {
  title: string;
  description: string;
  status: TaskStatus;
  createdBy: Types.ObjectId;
  assignedTo: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 1000
    },
    status: {
      type: String,
      enum: TASK_STATUS_VALUES_WITH_LEGACY,
      default: TASK_STATUSES.BACKLOG,
      required: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
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
        delete output['_id'];
        return ret;
      }
    }
  }
);

taskSchema.index({ createdBy: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ status: 1 });

export const Task = model<ITask>('Task', taskSchema);
