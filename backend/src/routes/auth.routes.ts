import type { Express, RequestHandler } from 'express';
import { createAuthRouter } from '../modules/auth/routes/auth.routes';

export const registerAuthRoutes = (app: Express, authLimiter: RequestHandler): void => {
  app.use('/api/auth', createAuthRouter(authLimiter));
};
