/**
 * Verrouillage séquentiel des chapitres.
 * Le 1er chapitre est toujours ouvert ; un chapitre se déverrouille quand le
 * précédent (par ordre de `sortOrder`) est terminé. Sans aucune progression,
 * seul le 1er chapitre est accessible.
 *
 * `orderedChapterIds` : ids des chapitres déjà triés par sortOrder.
 */
export function isChapterUnlocked(
  orderedChapterIds: readonly number[],
  chapterId: number,
  completedChapterIds: readonly number[],
): boolean {
  const index = orderedChapterIds.indexOf(chapterId);
  if (index < 0) return false;
  if (index === 0) return true;
  return completedChapterIds.includes(orderedChapterIds[index - 1]);
}

/** Ids des chapitres déverrouillés (1er + ceux dont le précédent est terminé). */
export function unlockedChapterIds(
  orderedChapterIds: readonly number[],
  completedChapterIds: readonly number[],
): number[] {
  return orderedChapterIds.filter((id) =>
    isChapterUnlocked(orderedChapterIds, id, completedChapterIds),
  );
}
