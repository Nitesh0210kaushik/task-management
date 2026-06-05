import { Router } from 'express';
import { assignTeamLead, listUsers } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';

export const userRouter = Router();

userRouter.use(authenticate);
userRouter.get('/', listUsers);
userRouter.patch('/:id/team-lead', assignTeamLead);

