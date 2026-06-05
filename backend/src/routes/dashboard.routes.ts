import type { Express } from 'express';
import { dashboardRouter } from '../modules/dashboard/routes/dashboard.routes';

export const registerDashboardRoutes = (app: Express): void => {
  app.use('/api/dashboard', dashboardRouter);
};
