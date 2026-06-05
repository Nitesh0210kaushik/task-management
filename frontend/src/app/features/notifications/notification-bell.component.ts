import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LucideBell } from '@lucide/angular';
import { Subscription } from 'rxjs';
import { NotificationService, RealtimeNotification } from '../../core/notification.service';
import { NotificationListComponent } from './notification-list.component';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, LucideBell, NotificationListComponent],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss'
})
export class NotificationBellComponent implements OnDestroy {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly notificationSubscription: Subscription;

  notifications: RealtimeNotification[] = [];
  isMenuOpen = false;

  constructor() {
    this.notificationSubscription = this.notificationService.notifications$.subscribe((notifications) => {
      this.notifications = notifications;
      this.cdr.markForCheck();
    });
  }

  get topNotifications(): RealtimeNotification[] {
    return this.notifications.slice(0, 5);
  }

  get unreadNotificationCount(): number {
    return this.notifications.filter((notification) => !notification.read).length;
  }

  ngOnDestroy(): void {
    this.notificationSubscription.unsubscribe();
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  openNotificationsPage(): void {
    this.isMenuOpen = false;
    this.notificationService.markAllRead();
    void this.router.navigate(['/notifications']);
  }
}
