import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { LucideBell } from '@lucide/angular';
import { Subscription, filter } from 'rxjs';
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
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly notificationSubscription: Subscription;
  private readonly routeSubscription: Subscription;

  notifications: RealtimeNotification[] = [];
  isMenuOpen = false;

  constructor() {
    this.notificationSubscription = this.notificationService.notifications$.subscribe((notifications) => {
      this.notifications = notifications;
      this.cdr.markForCheck();
    });

    this.routeSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.closeMenu();
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
    this.routeSubscription.unsubscribe();
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;

    if (this.isMenuOpen) {
      this.notificationService.loadNotifications();
    }
  }

  closeMenu(): void {
    if (!this.isMenuOpen) {
      return;
    }

    this.isMenuOpen = false;
    this.cdr.markForCheck();
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.closeMenu();
    }
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.closeMenu();
  }

  openNotificationsPage(): void {
    this.closeMenu();
    void this.router.navigate(['/notifications']);
  }
}
