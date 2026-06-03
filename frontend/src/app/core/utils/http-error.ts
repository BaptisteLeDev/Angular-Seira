import { HttpErrorResponse } from '@angular/common/http';

/**
 * Message lisible à partir d'une erreur HTTP.
 * Privilégie le `detail` renvoyé par API Platform (ex. 409 « Sort order already
 * exists… », 422 validation), sinon un message selon le status, sinon `fallback`.
 */
export function httpErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as Record<string, unknown> | null | undefined;
    const detail =
      body && typeof body === 'object'
        ? (body['detail'] ?? body['hydra:description'] ?? body['description'])
        : undefined;
    if (typeof detail === 'string' && detail.trim().length > 0) {
      return detail;
    }
    switch (error.status) {
      case 409:
        return 'Conflit : cette valeur est déjà utilisée.';
      case 422:
        return 'Données invalides : vérifiez les champs.';
      case 403:
        return 'Action non autorisée.';
      case 0:
        return 'Problème de connexion réseau.';
      default:
        return fallback;
    }
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}
