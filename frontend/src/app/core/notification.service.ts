import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, Notification } from './models';
import { AuthService } from './auth.service';

export type RealtimeNotification = Notification;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly notificationsSubject = new BehaviorSubject<RealtimeNotification[]>([]);
  private readonly authSubscription: Subscription;

  readonly notifications$ = this.notificationsSubject.asObservable();

  constructor() {
    this.authSubscription = this.auth.currentUser$.subscribe((user) => {
      if (!user) {
        this.notificationsSubject.next([]);
        return;
      }

      this.loadNotifications();
    });
  }

  get currentNotifications(): RealtimeNotification[] {
    return this.notificationsSubject.value;
  }

  loadNotifications(): void {
    this.http.get<ApiResponse<RealtimeNotification[]>>(`${environment.apiUrl}/notifications`).subscribe({
      next: (response) => this.notificationsSubject.next(response.data ?? []),
      error: () => this.notificationsSubject.next([])
    });
  }

  addRealtimeNotification(notification: RealtimeNotification): void {
    const existingNotifications = this.currentNotifications.filter((item) => item.id !== notification.id);
    this.notificationsSubject.next([notification, ...existingNotifications].slice(0, 50));
  }

  markAllRead(): Observable<ApiResponse<{ updatedCount: number }>> {
    const previousNotifications = this.currentNotifications;
    const readAt = new Date().toISOString();
    const nextNotifications = previousNotifications.map((notification) => ({
      ...notification,
      read: true,
      readAt: notification.readAt ?? readAt
    }));

    this.notificationsSubject.next(nextNotifications);

    return this.http.patch<ApiResponse<{ updatedCount: number }>>(`${environment.apiUrl}/notifications/read`, {}).pipe(
      catchError((error: unknown) => {
        this.notificationsSubject.next(previousNotifications);
        return throwError(() => error);
      })
    );
  }

  markOneRead(notificationId: string): Observable<ApiResponse<RealtimeNotification>> {
    const previousNotifications = this.currentNotifications;
    const readAt = new Date().toISOString();

    this.notificationsSubject.next(
      previousNotifications.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              read: true,
              readAt: notification.readAt ?? readAt
            }
          : notification
      )
    );

    return this.http.patch<ApiResponse<RealtimeNotification>>(`${environment.apiUrl}/notifications/${notificationId}/read`, {}).pipe(
      catchError((error: unknown) => {
        this.notificationsSubject.next(previousNotifications);
        return throwError(() => error);
      })
    );
  }

  deleteNotification(notificationId: string): Observable<ApiResponse<{ id: string; isDeleted: boolean }>> {
    const previousNotifications = this.currentNotifications;
    this.notificationsSubject.next(previousNotifications.filter((notification) => notification.id !== notificationId));

    return this.http.delete<ApiResponse<{ id: string; isDeleted: boolean }>>(`${environment.apiUrl}/notifications/${notificationId}`).pipe(
      catchError((error: unknown) => {
        this.notificationsSubject.next(previousNotifications);
        return throwError(() => error);
      })
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
}
