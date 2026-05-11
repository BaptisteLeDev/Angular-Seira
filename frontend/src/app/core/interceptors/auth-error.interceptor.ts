import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthStore } from '../stores/auth.store';

/**
 * Intercepte les 401 et redirige vers /login.
 * Sanctum n'a pas de refresh token, on vide simplement la session.
 */
export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  if (isAuthEndpoint(req.url)) {
    return next(req);
  }

  const authStore = inject(AuthStore);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (isUnauthorized(error)) {
        authStore.clearSession();
        router.navigateByUrl('/login');
      }
      return throwError(() => error);
    }),
  );
};

function isUnauthorized(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 401;
}

function isAuthEndpoint(url: string): boolean {
  const normalized = url.startsWith('http') ? url : `${environment.apiUrl}${url}`;
  return normalized.endsWith('/auth/login') || normalized.endsWith('/auth/logout');
}
