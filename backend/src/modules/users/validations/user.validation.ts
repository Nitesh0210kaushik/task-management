import { z } from 'zod';
import { USER_ROLES } from '../../../constants/roles';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i);

export const createUserSchema = z
  .object({
    username: z.string().trim().min(2).max(80),
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(8).max(120),
    role: z.literal(USER_ROLES.TEAM_LEAD)
  });

export const assignTeamLeadSchema = z.object({
  teamLeadId: objectIdSchema.nullable()
});
