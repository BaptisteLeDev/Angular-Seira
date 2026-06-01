import { HttpInterceptorFn } from '@angular/common/http';

/**
 * API Platform exige le content-type `application/merge-patch+json` pour les
 * operations PATCH (RFC 7386). Sans ca, le serveur repond 415 Unsupported
 * Media Type. On force donc l'entete sur toutes les requetes PATCH.
 */
export const mergePatchInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'PATCH') {
    return next(req);
  }

  const patchReq = req.clone({
    setHeaders: {
      'Content-Type': 'application/merge-patch+json',
    },
  });

  return next(patchReq);
};
