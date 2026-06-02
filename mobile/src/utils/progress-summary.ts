import { aggregatePercent, type ProgressStatus } from './video-progress';

export interface VideoStats {
  readonly started: number;
  readonly completed: number;
  readonly averagePercent: number;
}

/** Somme des secondes vues sur l'ensemble des vidéos suivies. */
export function totalWatchedSeconds(
  byVideoId: Record<number, { watchedSeconds: number }>,
): number {
  return Object.values(byVideoId).reduce((sum, e) => sum + (e.watchedSeconds ?? 0), 0);
}

/** Formate une durée en `M min` ou `H h M min`. */
export function formatWatchTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

/** Agrège des entrées de progression vidéo en compteurs d'ensemble. */
export function videoStats(
  entries: readonly { completionPercent: number; status: ProgressStatus }[],
): VideoStats {
  const started = entries.filter(
    (e) => e.completionPercent > 0 || e.status !== 'not_started',
  ).length;
  const completed = entries.filter((e) => e.status === 'completed').length;
  const averagePercent = aggregatePercent(entries.map((e) => e.completionPercent));
  return { started, completed, averagePercent };
}
