import type { Express, RequestHandler } from 'express';
import { registerAuthRoutes } from './auth.routes';
import { registerDashboardRoutes } from './dashboard.routes';
import { registerTaskRoutes } from './task.routes';
import { registerUserRoutes } from './user.routes';

export const registerApiRoutes = (app: Express, authLimiter: RequestHandler): void => {
  registerAuthRoutes(app, authLimiter);
  registerUserRoutes(app);
  registerTaskRoutes(app);
  registerDashboardRoutes(app);
};
