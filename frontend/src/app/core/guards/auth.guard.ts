import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../stores/auth.store';

/**
 * Bloque les routes protegees quand :
 *  - aucun JWT en localStorage,
 *  - ou le JWT est deja expire (claim `exp` passe).
 *
 * Si le token est expire, on vide la session avant de rediriger pour eviter
 * que d'autres composants le considerent comme valide.
 */
export const authGuard: CanActivateFn = (_route, _state) => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  if (!auth.isAuthenticated() || auth.isTokenExpired()) {
    auth.clearSession();
    return router.createUrlTree(['/login']);
  }

  return true;
};
