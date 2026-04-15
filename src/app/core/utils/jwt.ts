/**
 * Utilitaires JWT cote client — purement lecture.
 * On ne verifie PAS la signature (c'est le role du backend), on lit juste les
 * claims publics (notamment `exp`) pour eviter des allers-retours inutiles.
 */

interface JwtPayload {
  readonly exp?: number;
  readonly iat?: number;
  readonly sub?: string | number;
}

/** Decode la partie payload d'un JWT. Retourne null si le token est malforme. */
export function decodeJwt(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    const parsed = JSON.parse(json) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Retourne `true` si le token est absent, malforme, ou expire.
 * `clockSkewSeconds` ajoute une marge de securite (defaut 10s) pour eviter
 * qu'une requete parte avec un token qui va expirer pendant son voyage.
 */
export function isJwtExpired(token: string | null, clockSkewSeconds = 10): boolean {
  if (!token) return true;
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowSeconds + clockSkewSeconds;
}
