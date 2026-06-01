/** Extrait l'ID numerique d'un IRI JSON-LD (ex: "/api/chapters/3" → 3). */
export function iriToId(iri: string): number {
  const parts = iri.split('/');
  return Number(parts[parts.length - 1]);
}
