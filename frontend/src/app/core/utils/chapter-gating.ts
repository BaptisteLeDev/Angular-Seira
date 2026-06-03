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

/**
 * Gating assoupli : ensemble des chapitres comptés comme « faits » pour le
 * déverrouillage = ceux réellement complétés OU ceux **sans vidéo traçable**
 * (en attendant que le backend expose `video_id` sur ChapterContent, #29 —
 * sinon ces chapitres ne pourraient jamais se compléter et bloqueraient tout).
 * Le verrouillage reste actif pour les chapitres qui ont des vidéos traçables.
 *
 * @param completedIds            chapitres réellement terminés
 * @param chaptersWithTrackable   chapitres ayant ≥1 vidéo traçable
 * @param allChapterIds           tous les chapitres (ordre conservé en sortie)
 */
export function effectiveCompleted(
  completedIds: readonly number[],
  chaptersWithTrackable: readonly number[],
  allChapterIds: readonly number[],
): number[] {
  const completed = new Set(completedIds);
  const trackable = new Set(chaptersWithTrackable);
  return allChapterIds.filter((id) => completed.has(id) || !trackable.has(id));
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
