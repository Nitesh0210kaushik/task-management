import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { LucideTrash2, LucideX } from '@lucide/angular';
import { Subscription, finalize } from 'rxjs';
import { NotificationService, RealtimeNotification } from '../../core/notification.service';
import { ToastService } from '../../core/toast.service';
import { NotificationListComponent } from './notification-list.component';

@Component({
  selector: 'app-notification-page',
  standalone: true,
  imports: [CommonModule, NotificationListComponent, LucideTrash2, LucideX],
  templateUrl: './notification-page.component.html',
  styleUrl: './notification-page.component.scss'
})
export class NotificationPageComponent implements OnInit, OnDestroy {
  private readonly notificationService = inject(NotificationService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private notificationSubscription?: Subscription;

  notifications: RealtimeNotification[] = [];
  isMarkingRead = false;
  notificationPendingDelete: RealtimeNotification | null = null;
  private readonly readingNotificationIds = new Set<string>();
  private readonly deletingNotificationIds = new Set<string>();

  get unreadNotificationCount(): number {
    return this.notifications.filter((notification) => !notification.read).length;
  }

  get busyNotificationIds(): string[] {
    return [...new Set([...this.readingNotificationIds, ...this.deletingNotificationIds])];
  }

  isDeletingNotification(notification: RealtimeNotification): boolean {
    return this.deletingNotificationIds.has(notification.id);
  }

  notificationEventLabel(notification: RealtimeNotification): string {
    const labels: Record<RealtimeNotification['event'], string> = {
      'task:created': 'Task created',
      'task:updated': 'Task updated',
      'task:deleted': 'Task deleted'
    };

    return labels[notification.event];
  }

  ngOnInit(): void {
    this.notificationSubscription = this.notificationService.notifications$.subscribe((notifications) => {
      this.notifications = notifications;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.notificationSubscription?.unsubscribe();
  }

  markNotificationsRead(): void {
    if (!this.unreadNotificationCount || this.isMarkingRead) {
      return;
    }

    this.isMarkingRead = true;

    this.notificationService
      .markAllRead()
      .pipe(
        finalize(() => {
          this.isMarkingRead = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => this.toast.success('All notifications marked as read.', 'Notifications'),
        error: (error) => this.toast.fromError(error, 'Unable to mark notifications as read.')
      });
  }

  markNotificationRead(notification: RealtimeNotification): void {
    if (notification.read || this.readingNotificationIds.has(notification.id)) {
      return;
    }

    this.readingNotificationIds.add(notification.id);

    this.notificationService
      .markOneRead(notification.id)
      .pipe(
        finalize(() => {
          this.readingNotificationIds.delete(notification.id);
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => this.toast.success('Notification marked as read.', 'Notification'),
        error: (error) => this.toast.fromError(error, 'Unable to mark notification as read.')
      });
  }

  requestDeleteNotification(notification: RealtimeNotification): void {
    this.notificationPendingDelete = notification;
  }

  closeDeleteConfirmation(): void {
    if (this.notificationPendingDelete && this.deletingNotificationIds.has(this.notificationPendingDelete.id)) {
      return;
    }

    this.notificationPendingDelete = null;
  }

  confirmDeleteNotification(): void {
    const notification = this.notificationPendingDelete;

    if (!notification) {
      return;
    }

    if (this.deletingNotificationIds.has(notification.id)) {
      return;
    }

    this.deletingNotificationIds.add(notification.id);

    this.notificationService
      .deleteNotification(notification.id)
      .pipe(
        finalize(() => {
          this.deletingNotificationIds.delete(notification.id);
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.notificationPendingDelete = null;
          this.toast.success('Notification removed from your activity feed.', 'Deleted');
        },
        error: (error) => this.toast.fromError(error, 'Unable to delete notification.')
      });
  }
}
