import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationService, RealtimeNotification } from '../../core/notification.service';
import { NotificationListComponent } from './notification-list.component';

@Component({
  selector: 'app-notification-page',
  standalone: true,
  imports: [CommonModule, NotificationListComponent],
  templateUrl: './notification-page.component.html',
  styleUrl: './notification-page.component.scss'
})
export class NotificationPageComponent implements OnInit, OnDestroy {
  private readonly notificationService = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private notificationSubscription?: Subscription;

  notifications: RealtimeNotification[] = [];

  get unreadNotificationCount(): number {
    return this.notifications.filter((notification) => !notification.read).length;
  }

  ngOnInit(): void {
    this.notificationSubscription = this.notificationService.notifications$.subscribe((notifications) => {
      this.notifications = notifications;
      this.cdr.markForCheck();
    });
    this.markNotificationsRead();
  }

  ngOnDestroy(): void {
    this.notificationSubscription?.unsubscribe();
  }

  markNotificationsRead(): void {
    this.notificationService.markAllRead();
  }
}
