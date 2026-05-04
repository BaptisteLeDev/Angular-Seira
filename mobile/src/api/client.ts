import { ENV } from '@src/constants/env';
import { storage } from '@src/utils/storage';

export const TOKEN_KEY = 'seira.auth.token';

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
    finalHeaders['Content-Type'] = 'application/json';
  }
  if (auth) {
    const token = await storage.get(TOKEN_KEY);
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new HttpError(0, null, 'Serveur injoignable.');
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
