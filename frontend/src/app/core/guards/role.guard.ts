import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../stores/auth.store';
import type { UserRole } from '../schemas/user.schema';

/**
 * Garde fonctionnelle de contrôle d'accès par rôle.
 *
 * Utilisation dans les routes :
 * ```ts
 * {
 *   path: 'schools',
 *   canActivate: [authGuard, roleGuard],
 *   data: { roles: ['admin'] satisfies UserRole[] },
 *   loadComponent: () => import('...').then(m => m.SchoolList),
 * }
 * ```
 *
 * Logique :
 *  1. Lit `route.data['roles']` — si absent/vide → accès libre (pas de restriction de rôle).
 *  2. Si l'utilisateur possède au moins un rôle requis → laisse passer.
 *  3. Sinon → redirige vers `/unauthorized` (403, pas 401).
 *
 * Note : toujours combiner avec `authGuard` en premier pour garantir
 * que l'utilisateur est authentifié avant de vérifier son rôle.
 */
export const roleGuard: CanActivateFn = (route, _state) => {
  const auth   = inject(AuthStore);
  const router = inject(Router);

  const roles = route.data['roles'] as UserRole[] | undefined;

  // Aucune restriction de rôle déclarée sur cette route → accès libre
  if (!roles || roles.length === 0) {
    return true;
  }

  if (auth.hasAnyRole(roles)) {
    return true;
  }

  // L'utilisateur est authentifié mais n'a pas le rôle requis → 403
  return router.createUrlTree(['/unauthorized']);
};
