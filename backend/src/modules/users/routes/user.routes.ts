import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { assignTeamLead, createUser, listUsers } from '../controllers/user.controller';

export const userRouter = Router();

userRouter.use(authenticate);
userRouter.get('/', listUsers);
userRouter.post('/', createUser);
userRouter.patch('/:id/team-lead', assignTeamLead);
