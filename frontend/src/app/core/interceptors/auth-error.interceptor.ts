import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthStore } from '../stores/auth.store';

/**
 * Intercepte les reponses HTTP protegees.
 *
 *   401 -> tente un refresh (partage — single-flight via AuthStore)
 *     succes -> rejoue la requete originale avec le nouveau token
 *     echec  -> clearSession() + redirect /login
 *
 * Les routes d'authentification sont ignorees :
 *  - login/register : une 401 ici est une erreur utilisateur, pas une session invalide.
 *  - refresh        : evite la boucle infinie si le refresh lui-meme renvoie 401.
 *  - logout         : deja en cours de deconnexion, inutile d'essayer de refresh.
 *
 * Les requetes sans token (ex: home non authentifie) echouent normalement,
 * on ne declenche pas de refresh car il n'y a pas de session a prolonger.
 */

/** Marqueur pour eviter de retenter une requete deja rejouee apres refresh. */
const RETRY_FLAG = new HttpContextToken<boolean>(() => false);

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  if (isAuthEndpoint(req.url)) {
    return next(req);
  }

  const authStore = inject(AuthStore);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!isUnauthorized(error)) {
        return throwError(() => error);
      }

      // Pas de session a refresh : logout direct.
      if (!authStore.getToken()) {
        return throwError(() => error);
      }

      if (req.context.get(RETRY_FLAG)) {
        authStore.clearSession();
        router.navigateByUrl('/login');
        return throwError(() => error);
      }

      return authStore.refreshToken().pipe(
        switchMap((newToken) => {
          const retried = req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` },
            context: req.context.set(RETRY_FLAG, true),
          });
          return next(retried);
        }),
        catchError((refreshError: unknown) => {
          authStore.clearSession();
          router.navigateByUrl('/login');
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};

function isUnauthorized(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 401;
}

function isAuthEndpoint(url: string): boolean {
  const normalized = url.startsWith('http') ? url : `${environment.apiUrl}${url}`;
  return (
    normalized.endsWith('/auth/login') ||
    normalized.endsWith('/auth/register') ||
    normalized.endsWith('/auth/refresh') ||
    normalized.endsWith('/auth/logout')
  );
}
