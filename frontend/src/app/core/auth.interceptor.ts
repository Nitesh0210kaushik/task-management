import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, switchMap, throwError, type Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, AuthResponse } from './models';
import { AuthService } from './auth.service';

let refreshRequest$: Observable<ApiResponse<AuthResponse>> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isApiRequest = req.url.startsWith(environment.apiUrl);
  const isAuthRequest =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/refresh') ||
    req.url.includes('/auth/logout');
  const createApiRequest = () => {
    if (!isApiRequest) {
      return req;
    }

    const token = auth.token;
    const setHeaders: Record<string, string> = {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache'
    };

    if (token && !isAuthRequest) {
      setHeaders['Authorization'] = `Bearer ${token}`;
    }

    return req.clone({
      withCredentials: true,
      setHeaders
    });
  };

  const credentialedReq = createApiRequest();

  return next(credentialedReq).pipe(
    catchError((error: unknown) => {
      const shouldRefresh =
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        isApiRequest &&
        !isAuthRequest;

      if (!shouldRefresh) {
        return throwError(() => error);
      }

      refreshRequest$ ??= auth.refreshSession().pipe(finalize(() => (refreshRequest$ = null)));

      return refreshRequest$.pipe(
        switchMap(() => next(createApiRequest())),
        catchError((refreshError: unknown) => {
          auth.clearSession();
          void router.navigate(['/login']);
          return throwError(() => refreshError);
        })
      );
    })
  );
};
