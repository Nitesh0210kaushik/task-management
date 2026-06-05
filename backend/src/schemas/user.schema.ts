import { z } from 'zod';

export const assignTeamLeadSchema = z.object({
  teamLeadId: z.string().regex(/^[a-f\d]{24}$/i).nullable()
});

