import type { Express } from 'express';
import { userRouter } from '../modules/users/routes/user.routes';

export const registerUserRoutes = (app: Express): void => {
  app.use('/api/users', userRouter);
};

