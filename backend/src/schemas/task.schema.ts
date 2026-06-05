import { z } from 'zod';

export const taskStatusSchema = z.enum(['pending', 'completed']);

export const createTaskSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(1000),
  status: taskStatusSchema.default('pending'),
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
  status: taskStatusSchema.optional()
});

