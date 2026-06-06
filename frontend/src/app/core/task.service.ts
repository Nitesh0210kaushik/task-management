import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, Task, TaskStatus } from './models';

type TaskListResponse = ApiResponse<Task[]> | Task[];

export interface TaskFormPayload {
  title: string;
  description: string;
  status?: TaskStatus;
  assignedTo?: string;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);

  list(status?: TaskStatus, search?: string): Observable<Task[]> {
    let params = new HttpParams();

    if (status) {
      params = params.set('status', status);
    }

    if (search) {
      params = params.set('search', search);
    }

    return this.http
      .get<TaskListResponse>(`${environment.apiUrl}/tasks`, { params: params.keys().length ? params : undefined })
      .pipe(map((response) => (Array.isArray(response) ? response : response.data)));
  }

  create(payload: TaskFormPayload): Observable<ApiResponse<Task>> {
    return this.http.post<ApiResponse<Task>>(`${environment.apiUrl}/tasks`, payload);
  }

  update(id: string, payload: Partial<TaskFormPayload>): Observable<ApiResponse<Task>> {
    return this.http.patch<ApiResponse<Task>>(`${environment.apiUrl}/tasks/${id}`, payload);
  }

  delete(id: string): Observable<ApiResponse<{ id: string; isDeleted: boolean }>> {
    return this.http.delete<ApiResponse<{ id: string; isDeleted: boolean }>>(`${environment.apiUrl}/tasks/${id}`);
  }
}
