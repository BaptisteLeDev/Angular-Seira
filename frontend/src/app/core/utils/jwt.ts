/**
 * Sanctum tokens are opaque (not JWTs).
 * This utility is kept for potential future use but
 * isJwtExpired always returns false for non-null tokens
 * since Sanctum tokens don't expire client-side.
 */

export function isJwtExpired(token: string | null): boolean {
  return token === null;
}
