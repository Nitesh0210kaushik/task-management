import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { Notification, TaskRealtimePayload } from './models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private readonly auth = inject(AuthService);
  private socket: Socket | null = null;

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket?.disconnect();
    this.socket = io(environment.socketUrl, {
      auth: {
        token: this.auth.token
      },
      withCredentials: true,
      transports: ['websocket']
    });
  }

  onTaskChanges(): Observable<TaskRealtimePayload> {
    return new Observable((subscriber) => {
      if (!this.socket) {
        subscriber.complete();
        return;
      }

      const handler = (payload: TaskRealtimePayload) => subscriber.next(payload);

      this.socket.on('task:created', handler);
      this.socket.on('task:updated', handler);
      this.socket.on('task:deleted', handler);

      return () => {
        this.socket?.off('task:created', handler);
        this.socket?.off('task:updated', handler);
        this.socket?.off('task:deleted', handler);
      };
    });
  }

  onNotifications(): Observable<Notification> {
    return new Observable((subscriber) => {
      if (!this.socket) {
        subscriber.complete();
        return;
      }

      const handler = (payload: Notification) => subscriber.next(payload);
      this.socket.on('notification:new', handler);

      return () => {
        this.socket?.off('notification:new', handler);
      };
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}
