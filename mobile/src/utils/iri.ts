export function iriToId(iri: string): number {
  const parts = iri.split('/');
  return Number(parts[parts.length - 1]);
}
