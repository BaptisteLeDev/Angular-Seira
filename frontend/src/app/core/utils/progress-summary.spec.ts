import { describe, it, expect } from 'vitest';
import {
  summarizeSubjectProgress,
  totalWatchedSeconds,
  formatWatchTime,
} from './progress-summary';

describe('summarizeSubjectProgress', () => {
  const subjects = [
    { id: 1, name: 'Maths' },
    { id: 2, name: 'Histoire' },
  ];
  const chapterIdsBySubject = { 1: [10, 11], 2: [20] };
  const byChapterId = {
    10: { completionPercent: 100, status: 'completed' as const },
    11: { completionPercent: 50, status: 'in_progress' as const },
    20: { completionPercent: 0, status: 'not_started' as const },
  };

  it('agrège le % et le statut par matière', () => {
    const result = summarizeSubjectProgress(subjects, chapterIdsBySubject, byChapterId);
    expect(result).toEqual([
      {
        subjectId: 1,
        name: 'Maths',
        completionPercent: 75,
        status: 'in_progress',
        chaptersTotal: 2,
        chaptersCompleted: 1,
      },
      {
        subjectId: 2,
        name: 'Histoire',
        completionPercent: 0,
        status: 'not_started',
        chaptersTotal: 1,
        chaptersCompleted: 0,
      },
    ]);
  });

  it('chapitre sans progression connue compte comme 0%', () => {
    const [maths] = summarizeSubjectProgress(
      [{ id: 1, name: 'Maths' }],
      { 1: [10, 99] },
      { 10: { completionPercent: 100, status: 'completed' } },
    );
    expect(maths.completionPercent).toBe(50);
    expect(maths.chaptersCompleted).toBe(1);
  });

  it('matière sans chapitre -> 0% not_started', () => {
    const [s] = summarizeSubjectProgress([{ id: 5, name: 'Vide' }], {}, {});
    expect(s).toMatchObject({ completionPercent: 0, status: 'not_started', chaptersTotal: 0 });
  });
});

describe('totalWatchedSeconds', () => {
  it('somme les secondes vues', () => {
    expect(totalWatchedSeconds({ 1: { watchedSeconds: 30 }, 2: { watchedSeconds: 90 } })).toBe(120);
  });
  it('aucune progression -> 0', () => {
    expect(totalWatchedSeconds({})).toBe(0);
  });
});

describe('formatWatchTime', () => {
  it('moins d’une minute -> 0 min', () => {
    expect(formatWatchTime(0)).toBe('0 min');
    expect(formatWatchTime(59)).toBe('0 min');
  });
  it('minutes seules', () => {
    expect(formatWatchTime(60)).toBe('1 min');
    expect(formatWatchTime(150)).toBe('2 min');
  });
  it('heures + minutes', () => {
    expect(formatWatchTime(3600)).toBe('1 h 0 min');
    expect(formatWatchTime(3661)).toBe('1 h 1 min');
  });
});
