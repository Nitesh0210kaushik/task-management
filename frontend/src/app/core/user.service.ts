import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, User, UserRole } from './models';

type UserListResponse = ApiResponse<User[]> | User[];

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  role: Extract<UserRole, 'teamLead'>;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  list(): Observable<User[]> {
    return this.http
      .get<UserListResponse>(`${environment.apiUrl}/users`)
      .pipe(map((response) => (Array.isArray(response) ? response : response.data)));
  }

  create(payload: CreateUserPayload): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${environment.apiUrl}/users`, payload);
  }

  assignTeamLead(employeeId: string, teamLeadId: string | null): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${environment.apiUrl}/users/${employeeId}/team-lead`, {
      teamLeadId
    });
  }
}
