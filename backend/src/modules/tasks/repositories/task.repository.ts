import type { FilterQuery, PopulateOptions } from 'mongoose';
import { Task, type ITask } from '../models/task.model';
import type { CreateTaskDto } from '../dtos/task.dto';
import type { TaskStatus } from '../../../constants/task-status';

const taskPopulatePaths: PopulateOptions[] = [
  { path: 'createdBy', select: 'username email role teamLeadId' },
  { path: 'assignedTo', select: 'username email role teamLeadId' }
];

const activeTaskFilter = { isDeleted: { $ne: true } };

export class TaskRepository {
  findVisible(filter: FilterQuery<ITask>, status?: TaskStatus): Promise<ITask[]> {
    return Task.find({
      ...filter,
      ...(status ? { status } : {}),
      ...activeTaskFilter
    })
      .populate(taskPopulatePaths)
      .sort({ updatedAt: -1 })
      .exec();
  }

  findById(taskId: string): Promise<ITask | null> {
    return Task.findOne({ _id: taskId, ...activeTaskFilter }).exec();
  }

  create(payload: CreateTaskDto & { createdBy: string; assignedTo: string }): Promise<ITask> {
    return Task.create(payload);
  }

  populate(task: ITask): Promise<ITask> {
    return task.populate(taskPopulatePaths);
  }

  async softDelete(task: ITask): Promise<ITask> {
    task.isDeleted = true;
    task.deletedAt = new Date();
    return task.save();
  }
}
