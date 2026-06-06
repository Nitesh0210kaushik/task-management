import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, AuthPayload, AuthResponse, Session, User } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  private accessToken: string | null = null;

  readonly currentUser$ = this.currentUserSubject.asObservable();

  get token(): string | null {
    return this.accessToken;
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return Boolean(this.currentUser);
  }

  login(payload: AuthPayload): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/login`, payload, { withCredentials: true }).pipe(
      tap((response) => this.saveSession(response.data))
    );
  }

  register(payload: AuthPayload): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/register`, payload, { withCredentials: true }).pipe(
      tap((response) => this.saveSession(response.data))
    );
  }

  refreshSession(): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true }).pipe(
      tap((response) => this.saveSession(response.data))
    );
  }

  loadProfile(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${environment.apiUrl}/auth/me`, { withCredentials: true }).pipe(
      tap((response) => this.currentUserSubject.next(response.data))
    );
  }

  listSessions(): Observable<ApiResponse<Session[]>> {
    return this.http.get<ApiResponse<Session[]>>(`${environment.apiUrl}/auth/sessions`, { withCredentials: true });
  }

  revokeSession(sessionId: string): Observable<ApiResponse<{ success: boolean }>> {
    return this.http.delete<ApiResponse<{ success: boolean }>>(`${environment.apiUrl}/auth/sessions/${sessionId}`, {
      withCredentials: true
    });
  }

  logoutAll(): Observable<ApiResponse<{ success: boolean }>> {
    return this.http.post<ApiResponse<{ success: boolean }>>(`${environment.apiUrl}/auth/logout-all`, {}, { withCredentials: true }).pipe(
      tap(() => this.clearSession())
    );
  }

  saveSession(authResponse: AuthResponse): void {
    this.accessToken = authResponse.accessToken || authResponse.token;
    this.currentUserSubject.next(authResponse.user);
  }

  clearSession(): void {
    this.accessToken = null;
    this.currentUserSubject.next(null);
  }

  logout(): void {
    this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true }).subscribe({
      next: () => this.finishLogout(),
      error: () => this.finishLogout()
    });
  }

  private finishLogout(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }
}
