import { aggregatePercent, deriveStatus, type ProgressStatus } from './video-progress';

export interface SubjectProgress {
  readonly subjectId: number;
  readonly name: string;
  readonly completionPercent: number;
  readonly status: ProgressStatus;
  readonly chaptersTotal: number;
  readonly chaptersCompleted: number;
}

interface ChapterProgressLike {
  readonly completionPercent: number;
  readonly status: ProgressStatus;
}

/**
 * Construit le résumé d'avancement par matière à partir de la progression
 * chapitre de l'élève. Un chapitre sans progression connue compte pour 0 %.
 */
export function summarizeSubjectProgress(
  subjects: readonly { id: number; name: string }[],
  chapterIdsBySubject: Record<number, number[]>,
  byChapterId: Record<number, ChapterProgressLike>,
): SubjectProgress[] {
  return subjects.map((subject) => {
    const chapterIds = chapterIdsBySubject[subject.id] ?? [];
    const percents = chapterIds.map((cid) => byChapterId[cid]?.completionPercent ?? 0);
    const completionPercent = aggregatePercent(percents);
    const chaptersCompleted = chapterIds.filter(
      (cid) => byChapterId[cid]?.status === 'completed',
    ).length;
    return {
      subjectId: subject.id,
      name: subject.name,
      completionPercent,
      status: deriveStatus(completionPercent),
      chaptersTotal: chapterIds.length,
      chaptersCompleted,
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
