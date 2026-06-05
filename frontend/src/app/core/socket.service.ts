import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { TaskRealtimePayload } from './models';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(environment.socketUrl, {
      auth: { token },
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

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}

