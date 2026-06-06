import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LucideBell } from '@lucide/angular';
import { Subscription } from 'rxjs';
import { NotificationService, RealtimeNotification } from '../../core/notification.service';

@Component({
  selector: 'app-notification-nav-item',
  standalone: true,
  imports: [CommonModule, LucideBell],
  templateUrl: './notification-nav-item.component.html',
  styleUrl: './notification-nav-item.component.scss'
})
export class NotificationNavItemComponent implements OnDestroy {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly notificationSubscription: Subscription;

  @Input() active = false;
  @Input() compact = false;

  notifications: RealtimeNotification[] = [];

  constructor() {
    this.notificationSubscription = this.notificationService.notifications$.subscribe((notifications) => {
      this.notifications = notifications;
      this.cdr.markForCheck();
    });
  }

  get unreadNotificationCount(): number {
    return this.notifications.filter((notification) => !notification.read).length;
  }

  ngOnDestroy(): void {
    this.notificationSubscription.unsubscribe();
  }

  openNotificationsPage(): void {
    void this.router.navigate(['/notifications']);
  }
}
