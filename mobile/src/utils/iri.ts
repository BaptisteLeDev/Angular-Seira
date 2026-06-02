/**
 * Extrait l'id numérique d'une IRI JSON-LD (ex: "/api/chapters/3" → 3).
 * Renvoie `null` si l'IRI est vide, malformée, ou ne se termine pas par un
 * entier positif (évite les `NaN` silencieux propagés dans les URLs/clés).
 */
export function iriToId(iri: string | null | undefined): number | null {
  if (!iri) return null;
  const last = iri.split('/').pop();
  if (!last) return null;
  const n = Number(last);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Alias rétrocompatible (anciennement dupliqué dans plusieurs écrans). */
export const safeIriToId = iriToId;
