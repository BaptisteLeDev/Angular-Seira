import { describe, it, expect } from 'vitest';
import { isChapterUnlocked, unlockedChapterIds, effectiveCompleted } from './chapter-gating';

describe('effectiveCompleted (gating assoupli)', () => {
  it('gating actif : un chapitre traçable non terminé ne passe pas', () => {
    expect(effectiveCompleted([], [10, 20], [10, 20])).toEqual([]);
  });
  it('un chapitre sans vidéo traçable passe (ne bloque pas)', () => {
    expect(effectiveCompleted([], [10], [10, 20])).toEqual([20]);
  });
  it('combine complétés réels + chapitres non traçables, dans l’ordre', () => {
    expect(effectiveCompleted([10], [10, 20], [10, 20, 30])).toEqual([10, 30]);
  });
  it('aucune vidéo traçable nulle part -> tout passe (aucun verrou)', () => {
    expect(effectiveCompleted([], [], [10, 20, 30])).toEqual([10, 20, 30]);
  });
});

const order = [10, 20, 30];

describe('isChapterUnlocked', () => {
  it('le 1er chapitre est toujours déverrouillé', () => {
    expect(isChapterUnlocked(order, 10, [])).toBe(true);
  });
  it('par défaut seul le 1er est déverrouillé', () => {
    expect(isChapterUnlocked(order, 20, [])).toBe(false);
    expect(isChapterUnlocked(order, 30, [])).toBe(false);
  });
  it('déverrouille quand le précédent est fait', () => {
    expect(isChapterUnlocked(order, 20, [10])).toBe(true);
    expect(isChapterUnlocked(order, 30, [10])).toBe(false);
    expect(isChapterUnlocked(order, 30, [10, 20])).toBe(true);
  });
  it('chapitre inconnu -> verrouillé', () => {
    expect(isChapterUnlocked(order, 999, [10, 20])).toBe(false);
  });
});

describe('unlockedChapterIds', () => {
  it('par défaut seul le 1er', () => {
    expect(unlockedChapterIds(order, [])).toEqual([10]);
  });
  it('déblocage séquentiel', () => {
    expect(unlockedChapterIds(order, [10])).toEqual([10, 20]);
    expect(unlockedChapterIds(order, [10, 20])).toEqual([10, 20, 30]);
  });
  it('liste vide -> vide', () => {
    expect(unlockedChapterIds([], [10])).toEqual([]);
  });
});
