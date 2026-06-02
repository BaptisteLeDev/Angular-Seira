import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../stores/auth.store';

/**
 * Bloque les routes protégées quand aucun token n'est présent.
 *
 * Les tokens Sanctum sont opaques (pas de claim `exp` lisible côté client) :
 * l'expiration réelle est détectée côté serveur (401) puis gérée par
 * `authErrorInterceptor`, qui vide la session et redirige.
 */
export const authGuard: CanActivateFn = (_route, _state) => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    auth.clearSession();
    return router.createUrlTree(['/login']);
  }

  return true;
};
