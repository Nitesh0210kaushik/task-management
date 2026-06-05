import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { AuthService } from './auth.service';
import { TaskRealtimePayload, TaskStatus } from './models';

export interface RealtimeNotification {
  id: string;
  event: TaskRealtimePayload['event'];
  taskId: string;
  title: string;
  message: string;
  status: TaskStatus;
  createdAt: string;
  read: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly auth = inject(AuthService);
  private readonly storageKeyPrefix = 'task-management-notifications';
  private readonly notificationsSubject = new BehaviorSubject<RealtimeNotification[]>([]);
  private readonly authSubscription: Subscription;
  private notificationSequence = 0;
  private activeStorageKey: string | null = null;

  readonly notifications$ = this.notificationsSubject.asObservable();

  constructor() {
    this.authSubscription = this.auth.currentUser$.subscribe((user) => {
      const nextStorageKey = user?.id ? this.storageKeyForUser(user.id) : null;

      if (nextStorageKey === this.activeStorageKey) {
        return;
      }

      this.activeStorageKey = nextStorageKey;
      this.notificationsSubject.next(nextStorageKey ? this.readNotifications(nextStorageKey) : []);
    });
  }

  get currentNotifications(): RealtimeNotification[] {
    return this.notificationsSubject.value;
  }

  addTaskNotification(payload: TaskRealtimePayload): void {
    const taskTitle = payload.task?.title || 'Task';
    const ownerName = this.userNameFromReference(payload.task?.assignedTo, 'assigned user');
    const creatorName = this.userNameFromReference(payload.task?.createdBy, 'workspace user');
    const status = this.normalizeStatusValue(payload.task?.status ?? 'backlog');
    const eventLabels: Record<TaskRealtimePayload['event'], string> = {
      'task:created': 'Task created',
      'task:updated': 'Task updated',
      'task:deleted': 'Task deleted'
    };
    const eventMessages: Record<TaskRealtimePayload['event'], string> = {
      'task:created': `${creatorName} created "${taskTitle}" for ${ownerName}.`,
      'task:updated': `${creatorName} updated "${taskTitle}" for ${ownerName}.`,
      'task:deleted': `${creatorName} deleted "${taskTitle}".`
    };

    const notification: RealtimeNotification = {
      id: `${Date.now()}-${++this.notificationSequence}`,
      event: payload.event,
      taskId: payload.taskId,
      title: eventLabels[payload.event],
      message: eventMessages[payload.event],
      status,
      createdAt: new Date().toISOString(),
      read: false
    };

    this.setNotifications([notification, ...this.currentNotifications].slice(0, 50));
  }

  markAllRead(): void {
    this.setNotifications(
      this.currentNotifications.map((notification) => ({
        ...notification,
        read: true
      }))
    );
  }

  formatNotificationTime(value: string): string {
    const elapsedMs = Date.now() - new Date(value).getTime();
    const elapsedMinutes = Math.max(0, Math.floor(elapsedMs / 60000));

    if (elapsedMinutes < 1) {
      return 'Just now';
    }

    if (elapsedMinutes < 60) {
      return `${elapsedMinutes}m ago`;
    }

    const elapsedHours = Math.floor(elapsedMinutes / 60);

    if (elapsedHours < 24) {
      return `${elapsedHours}h ago`;
    }

    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    }).format(new Date(value));
  }

  private normalizeStatusValue(status: TaskStatus | string): TaskStatus {
    return status === 'pending' ? 'backlog' : (status as TaskStatus);
  }

  private userNameFromReference(reference: unknown, fallback: string): string {
    if (!reference || typeof reference !== 'object') {
      return fallback;
    }

    const username = (reference as { username?: unknown }).username;
    return typeof username === 'string' && username.trim() ? username : fallback;
  }

  private setNotifications(notifications: RealtimeNotification[]): void {
    this.notificationsSubject.next(notifications);
    this.writeNotifications(notifications);
  }

  private storageKeyForUser(userId: string): string {
    return `${this.storageKeyPrefix}:${userId}`;
  }

  private readNotifications(storageKey: string): RealtimeNotification[] {
    try {
      const rawValue = localStorage.getItem(storageKey);

      if (!rawValue) {
        return [];
      }

      const parsedValue = JSON.parse(rawValue);
      return Array.isArray(parsedValue) ? parsedValue.filter((item) => this.isRealtimeNotification(item)).slice(0, 50) : [];
    } catch {
      return [];
    }
  }

  private writeNotifications(notifications: RealtimeNotification[]): void {
    if (!this.activeStorageKey) {
      return;
    }

    try {
      localStorage.setItem(this.activeStorageKey, JSON.stringify(notifications.slice(0, 50)));
    } catch {
      // Storage can fail in private mode or quota-limited browsers; live notifications should still work.
    }
  }

  private isRealtimeNotification(value: unknown): value is RealtimeNotification {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const notification = value as Partial<RealtimeNotification>;
    return (
      typeof notification.id === 'string' &&
      typeof notification.taskId === 'string' &&
      typeof notification.title === 'string' &&
      typeof notification.message === 'string' &&
      typeof notification.createdAt === 'string' &&
      typeof notification.read === 'boolean' &&
      (notification.event === 'task:created' || notification.event === 'task:updated' || notification.event === 'task:deleted') &&
      (notification.status === 'backlog' || notification.status === 'inProgress' || notification.status === 'completed')
    );
  }
}
