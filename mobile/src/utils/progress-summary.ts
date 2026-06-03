import { aggregatePercent, deriveStatus, COMPLETED_THRESHOLD, type ProgressStatus } from './video-progress';

export interface VideoStats {
  readonly started: number;
  readonly completed: number;
  readonly averagePercent: number;
}

export interface SubjectProgress {
  readonly subjectId: number;
  readonly name: string;
  readonly completionPercent: number;
  readonly status: ProgressStatus;
  readonly videosTotal: number;
  readonly videosCompleted: number;
}

/**
 * Avancement par matière, dérivé des pourcentages des vidéos de chaque matière
 * (le mobile ne suit pas le ChapterProgress, contrairement au web ; on agrège
 * donc directement au niveau vidéo). Parité fonctionnelle avec le web.
 */
export function summarizeSubjectProgress(
  subjects: readonly { id: number; name: string }[],
  videoPercentsBySubject: Record<number, number[]>,
): SubjectProgress[] {
  return subjects.map((s) => {
    const percents = videoPercentsBySubject[s.id] ?? [];
    const completionPercent = aggregatePercent(percents);
    return {
      subjectId: s.id,
      name: s.name,
      completionPercent,
      status: deriveStatus(completionPercent),
      videosTotal: percents.length,
      videosCompleted: percents.filter((p) => p >= COMPLETED_THRESHOLD).length,
    };
  });
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
