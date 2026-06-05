import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.token) {
    return router.parseUrl('/login');
  }

  if (auth.currentUser) {
    return true;
  }

  return auth.loadProfile().pipe(
    map(() => true),
    catchError(() => {
      auth.logout();
      return of(router.parseUrl('/login'));
    })
  );
};

