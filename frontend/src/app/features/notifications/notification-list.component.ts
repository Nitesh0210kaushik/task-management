import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { LucideCheck, LucideTrash2 } from '@lucide/angular';
import { NotificationService, RealtimeNotification } from '../../core/notification.service';

type NotificationListVariant = 'compact' | 'grid';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, LucideCheck, LucideTrash2],
  templateUrl: './notification-list.component.html',
  styleUrl: './notification-list.component.scss'
})
export class NotificationListComponent {
  private readonly notificationService = inject(NotificationService);

  @Input() notifications: RealtimeNotification[] = [];
  @Input() variant: NotificationListVariant = 'compact';
  @Input() emptyText = 'No notifications yet.';
  @Input() showActions = false;
  @Input() busyNotificationIds: string[] = [];

  @Output() markReadRequested = new EventEmitter<RealtimeNotification>();
  @Output() deleteRequested = new EventEmitter<RealtimeNotification>();

  formatNotificationTime(value: string): string {
    return this.notificationService.formatNotificationTime(value);
  }

  isBusy(notification: RealtimeNotification): boolean {
    return this.busyNotificationIds.includes(notification.id);
  }
}
