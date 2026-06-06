import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import {
  deleteNotification,
  deleteNotifications,
  listNotifications,
  markNotificationRead,
  markNotificationsRead
} from '../controllers/notification.controller';

export const notificationRouter = Router();

notificationRouter.use(authenticate);
notificationRouter.get('/', listNotifications);
notificationRouter.patch('/read', markNotificationsRead);
notificationRouter.patch('/:id/read', markNotificationRead);
notificationRouter.delete('/delete-all', deleteNotifications);
notificationRouter.delete('/:id', deleteNotification);
