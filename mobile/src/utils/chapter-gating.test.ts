import { isChapterUnlocked, unlockedChapterIds } from './chapter-gating';

// chapitres triés par sortOrder, ids dans l'ordre
const order = [10, 20, 30];

describe('isChapterUnlocked', () => {
  it('le 1er chapitre est toujours déverrouillé', () => {
    expect(isChapterUnlocked(order, 10, [])).toBe(true);
  });
  it('par défaut (aucun chapitre fait) seul le 1er est déverrouillé', () => {
    expect(isChapterUnlocked(order, 20, [])).toBe(false);
    expect(isChapterUnlocked(order, 30, [])).toBe(false);
  });
  it('un chapitre se déverrouille quand le précédent est fait', () => {
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
  it('liste de chapitres vide -> vide', () => {
    expect(unlockedChapterIds([], [10])).toEqual([]);
  });
});
