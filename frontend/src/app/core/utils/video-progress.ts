/**
 * Logique pure de dérivation de la progression (vidéo + chapitre) côté web.
 * Miroir du `mobile/src/utils/video-progress.ts` : mêmes seuils, mêmes statuts,
 * pour que les deux clients produisent des payloads cohérents vers l'API.
 */

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

/** Au-delà de ce pourcentage vu, la progression est considérée terminée. */
export const COMPLETED_THRESHOLD = 95;

export interface VideoProgressPayload {
  readonly watchedSecondsValidated: number;
  readonly completionPercent: number;
  readonly status: ProgressStatus;
  readonly lastSeenAt: string;
}

export interface ChapterProgressPayload {
  readonly chapterId: number;
  readonly completionPercent: number;
  readonly status: ProgressStatus;
}

/** Borne un pourcentage entre 0 et 100 ; NaN -> 0. */
export function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

/** Statut à trois états dérivé d'un pourcentage vu. */
export function deriveStatus(percent: number): ProgressStatus {
  if (percent >= COMPLETED_THRESHOLD) return 'completed';
  if (percent > 0) return 'in_progress';
  return 'not_started';
}

/**
 * Plafond anti-skip : monte en lecture continue, bloque les sauts avant
 * au-delà de la tolérance, ignore les reculs (renvoie le plafond inchangé).
 * Mutualisé entre lecteur natif et lecteur YouTube (IFrame API).
 */
export function computeCap(cap: number, currentTime: number, tolerance = 1): number {
  if (currentTime > cap + tolerance) return cap;
  return Math.max(cap, currentTime);
}

/** Moyenne entière d'une liste de pourcentages ; liste vide -> 0. */
export function aggregatePercent(percents: number[]): number {
  if (percents.length === 0) return 0;
  const sum = percents.reduce((a, b) => a + b, 0);
  return Math.round(sum / percents.length);
}

/**
 * Décide s'il faut renvoyer la progression au serveur : vrai dès qu'au moins
 * `step` nouvelles secondes ont été vues depuis le dernier envoi. Évite de
 * spammer l'API à chaque `timeupdate` (~4/s) tout en restant réactif.
 */
export function shouldFlush(cap: number, lastSent: number, step = 8): boolean {
  return Math.floor(cap) - lastSent >= step;
}

/**
 * Construit le payload de progression d'une vidéo à partir du plafond anti-skip
 * (secondes vues en lecture continue) et de la durée totale.
 */
export function buildVideoProgressPayload(
  cap: number,
  duration: number,
  lastSeenAt: string,
): VideoProgressPayload {
  const completionPercent =
    duration > 0 ? clampPercent(Math.round((cap / duration) * 100)) : 0;
  return {
    watchedSecondsValidated: Math.floor(cap),
    completionPercent,
    status: deriveStatus(completionPercent),
    lastSeenAt,
  };
}

/**
 * Construit le payload de progression d'un chapitre en agrégeant les
 * pourcentages vus de ses vidéos.
 */
export function buildChapterProgressPayload(
  chapterId: number,
  videoPercents: number[],
): ChapterProgressPayload {
  const completionPercent = aggregatePercent(videoPercents);
  return {
    chapterId,
    completionPercent,
    status: deriveStatus(completionPercent),
  };
}
