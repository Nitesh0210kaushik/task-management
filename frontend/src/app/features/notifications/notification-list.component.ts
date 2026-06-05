import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { NotificationService, RealtimeNotification } from '../../core/notification.service';

type NotificationListVariant = 'compact' | 'grid';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-list.component.html',
  styleUrl: './notification-list.component.scss'
})
export class NotificationListComponent {
  private readonly notificationService = inject(NotificationService);

  @Input() notifications: RealtimeNotification[] = [];
  @Input() variant: NotificationListVariant = 'compact';
  @Input() emptyText = 'No notifications yet.';

  formatNotificationTime(value: string): string {
    return this.notificationService.formatNotificationTime(value);
  }
}
