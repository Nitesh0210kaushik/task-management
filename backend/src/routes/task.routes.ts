import type { Express } from 'express';
import { taskRouter } from '../modules/tasks/routes/task.routes';

export const registerTaskRoutes = (app: Express): void => {
  app.use('/api/tasks', taskRouter);
};

