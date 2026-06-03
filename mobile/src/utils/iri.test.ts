import { iriToId, safeIriToId } from './iri';

describe('iriToId', () => {
  test('extrait l’id numérique d’une IRI valide', () => {
    expect(iriToId('/api/chapters/3')).toBe(3);
    expect(iriToId('/api/videos/42')).toBe(42);
  });
  test('null sur IRI vide / nulle / malformée', () => {
    expect(iriToId(null)).toBeNull();
    expect(iriToId(undefined)).toBeNull();
    expect(iriToId('')).toBeNull();
    expect(iriToId('/api/chapters/')).toBeNull();
    expect(iriToId('/api/chapters/abc')).toBeNull();
  });
  test('null si non entier positif', () => {
    expect(iriToId('/api/x/0')).toBeNull();
    expect(iriToId('/api/x/-2')).toBeNull();
    expect(iriToId('/api/x/1.5')).toBeNull();
  });
  test('safeIriToId est un alias de iriToId', () => {
    expect(safeIriToId('/api/chapters/3')).toBe(3);
    expect(safeIriToId('bad')).toBeNull();
  });
});
