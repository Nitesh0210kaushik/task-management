import { z } from 'zod';
import { LEGACY_TASK_STATUSES, TASK_STATUSES } from '../../../constants/task-status';

export const taskStatusSchema = z
  .enum([TASK_STATUSES.BACKLOG, TASK_STATUSES.IN_PROGRESS, TASK_STATUSES.COMPLETED, LEGACY_TASK_STATUSES.PENDING])
  .transform((status) => (status === LEGACY_TASK_STATUSES.PENDING ? TASK_STATUSES.BACKLOG : status));

export const createTaskSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(1000),
  status: taskStatusSchema.default(TASK_STATUSES.BACKLOG),
  assignedTo: z.string().regex(/^[a-f\d]{24}$/i).optional()
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(2).max(120).optional(),
    description: z.string().trim().min(2).max(1000).optional(),
    status: taskStatusSchema.optional(),
    assignedTo: z.string().regex(/^[a-f\d]{24}$/i).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required.'
  });

export const taskQuerySchema = z.object({
  status: taskStatusSchema.optional(),
  search: z.preprocess(
    (value) => (typeof value === 'string' && !value.trim() ? undefined : value),
    z.string().trim().min(3).max(80).optional()
  )
});
