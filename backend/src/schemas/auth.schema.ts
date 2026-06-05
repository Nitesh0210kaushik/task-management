import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().trim().min(2).max(80),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(120),
  role: z.enum(['manager', 'teamLead', 'employee']).default('employee')
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1)
});

