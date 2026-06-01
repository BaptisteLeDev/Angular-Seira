import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '@environments/environment';
import { AuthStore } from '../stores/auth.store';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  if (isPublicAuthRoute(req.url)) {
    return next(req);
  }

  const token = inject(AuthStore).getToken();
  if (!token) {
    return next(req);
  }

  const requestWithToken = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(requestWithToken);
};

function isPublicAuthRoute(url: string): boolean {
  const normalized = url.startsWith('http') ? url : `${environment.apiUrl}${url}`;
  return normalized.endsWith('/auth/login') || normalized.endsWith('/auth/register');
}
