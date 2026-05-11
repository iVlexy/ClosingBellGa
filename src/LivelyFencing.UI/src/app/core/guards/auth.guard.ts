import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const authGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.getMe().pipe(
      map(user => {
        if (!user) {
          // No CF session — redirect to landing page
          return router.createUrlTree(['/']);
        }
        const effectiveRole = auth.impersonatedRole ?? user.role;
        if (allowedRoles.includes(effectiveRole)) return true;
        // Wrong role: portal-only roles go to landing, internal users go to unauthorized
        const portalOnly = effectiveRole === 'Customer' || effectiveRole === 'FMLSApprover';
        return router.createUrlTree(portalOnly ? ['/'] : ['/unauthorized']);
      }),
      catchError(() => of(router.createUrlTree(['/'])))
    );
  };
};
