import { z } from 'zod';
import { USER_ROLES } from '../../../constants/roles';

export const registerSchema = z.object({
  username: z.string().trim().min(2).max(80),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(120),
  role: z.literal(USER_ROLES.EMPLOYEE).optional().default(USER_ROLES.EMPLOYEE)
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1)
});
