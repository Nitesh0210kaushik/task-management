import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, Task, TaskStatus } from './models';

export interface TaskFormPayload {
  title: string;
  description: string;
  status?: TaskStatus;
  assignedTo?: string;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);

  list(status?: TaskStatus): Observable<ApiResponse<Task[]>> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<ApiResponse<Task[]>>(`${environment.apiUrl}/tasks`, { params });
  }

  create(payload: TaskFormPayload): Observable<ApiResponse<Task>> {
    return this.http.post<ApiResponse<Task>>(`${environment.apiUrl}/tasks`, payload);
  }

  update(id: string, payload: Partial<TaskFormPayload>): Observable<ApiResponse<Task>> {
    return this.http.patch<ApiResponse<Task>>(`${environment.apiUrl}/tasks/${id}`, payload);
  }

  delete(id: string): Observable<ApiResponse<{ id: string }>> {
    return this.http.delete<ApiResponse<{ id: string }>>(`${environment.apiUrl}/tasks/${id}`);
  }
}

