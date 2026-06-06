import type { Types } from 'mongoose';
import { Notification, type INotification } from '../models/notification.model';

export type CreateNotificationRecord = Pick<
  INotification,
  'recipient' | 'taskId' | 'event' | 'title' | 'message' | 'status'
> & {
  actor?: Types.ObjectId | null;
  read?: boolean;
};

const activeNotificationFilter = { isDeleted: { $ne: true } };

export class NotificationRepository {
  findByRecipient(recipientId: string | Types.ObjectId, limit = 50): Promise<INotification[]> {
    return Notification.find({ recipient: recipientId, ...activeNotificationFilter }).sort({ createdAt: -1 }).limit(limit).exec();
  }

  createMany(records: CreateNotificationRecord[]): Promise<INotification[]> {
    return Notification.insertMany(records, { ordered: false });
  }

  async markAllRead(recipientId: string | Types.ObjectId): Promise<number> {
    const result = await Notification.updateMany(
      { recipient: recipientId, read: false, ...activeNotificationFilter },
      { $set: { read: true, readAt: new Date() } }
    );
    return result.modifiedCount;
  }

  markOneRead(recipientId: string | Types.ObjectId, notificationId: string): Promise<INotification | null> {
    return Notification.findOneAndUpdate(
      { _id: notificationId, recipient: recipientId, ...activeNotificationFilter },
      { $set: { read: true, readAt: new Date() } },
      { new: true }
    ).exec();
  }

  softDelete(recipientId: string | Types.ObjectId, notificationId: string): Promise<INotification | null> {
    return Notification.findOneAndUpdate(
      { _id: notificationId, recipient: recipientId, ...activeNotificationFilter },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true }
    ).exec();
  }

  async softDeleteAll(recipientId: string | Types.ObjectId): Promise<number> {
    const result = await Notification.updateMany(
      { recipient: recipientId, ...activeNotificationFilter },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );
    return result.modifiedCount;
  }
}
