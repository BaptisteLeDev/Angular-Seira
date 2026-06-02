import { ENV } from '@src/constants/env';
import { storage } from '@src/utils/storage';

export const TOKEN_KEY = 'seira.auth.token';

/** Délai max d'une requête avant abandon (évite le spinner infini). */
const TIMEOUT_MS = 15000;

/**
 * Handler global déclenché sur 401 d'une requête authentifiée (token expiré).
 * Enregistré au démarrage (app/_layout) pour déconnecter + rediriger.
 */
let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null): void {
  unauthorizedHandler = fn;
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
};

export async function apiRequest<T = unknown>(
  path: string,
  { method = 'GET', body, auth = true, headers = {} }: RequestOptions = {},
): Promise<T> {
  const url = path.startsWith('http') ? path : `${ENV.apiUrl}${path}`;

  const finalHeaders: Record<string, string> = {
    Accept: 'application/ld+json, application/json',
    ...headers,
  };
  if (body !== undefined) {
    // API Platform exige application/merge-patch+json pour les PATCH ;
    // application/json sinon (POST/PUT). Sinon -> 415 Unsupported Media Type.
    finalHeaders['Content-Type'] =
      method === 'PATCH' ? 'application/merge-patch+json' : 'application/json';
  }
  if (auth) {
    const token = await storage.get(TOKEN_KEY);
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    throw new HttpError(0, null, aborted ? "Délai d'attente dépassé." : 'Serveur injoignable.');
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const rawText = await response.text();
  let parsed: unknown = null;
  if (rawText.length > 0) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = rawText;
    }
  }

  if (!response.ok) {
    // Token expiré en session : déconnexion + redirection globale (sauf sur les
    // requêtes non authentifiées comme le login, qui gèrent leur propre erreur).
    if (response.status === 401 && auth) {
      unauthorizedHandler?.();
    }
    const msg = extractMessage(parsed) ?? defaultMessage(response.status);
    throw new HttpError(response.status, parsed, msg);
  }

  return parsed as T;
}

function extractMessage(body: unknown): string | null {
  if (typeof body === 'string' && body.length > 0) return body;
  if (body && typeof body === 'object' && 'message' in body) {
    const m = (body as { message: unknown }).message;
    if (typeof m === 'string') return m;
  }
  return null;
}

function defaultMessage(status: number): string {
  if (status === 401 || status === 403) return 'Session invalide ou expirée.';
  if (status === 422) return 'Données invalides.';
  if (status === 0) return 'Serveur injoignable.';
  return 'Erreur réseau.';
}
