import type { Express } from 'express';
import { notificationRouter } from '../modules/notifications/routes/notification.routes';

export const registerNotificationRoutes = (app: Express): void => {
  app.use('/api/notifications', notificationRouter);
};
