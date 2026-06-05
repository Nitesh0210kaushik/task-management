import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.currentUser) {
    return true;
  }

  return auth.refreshSession().pipe(
    map(() => true),
    catchError(() => {
      auth.clearSession();
      return of(router.parseUrl('/login'));
    })
  );
};
