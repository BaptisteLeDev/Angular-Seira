import { totalWatchedSeconds, formatWatchTime, videoStats } from './progress-summary';

describe('totalWatchedSeconds', () => {
  test('somme les secondes vues', () => {
    expect(totalWatchedSeconds({ 1: { watchedSeconds: 30 }, 2: { watchedSeconds: 90 } })).toBe(120);
  });
  test('aucune progression -> 0', () => {
    expect(totalWatchedSeconds({})).toBe(0);
  });
});

describe('formatWatchTime', () => {
  test('moins d’une minute -> 0 min', () => {
    expect(formatWatchTime(0)).toBe('0 min');
    expect(formatWatchTime(59)).toBe('0 min');
  });
  test('minutes seules', () => {
    expect(formatWatchTime(60)).toBe('1 min');
    expect(formatWatchTime(150)).toBe('2 min');
  });
  test('heures + minutes', () => {
    expect(formatWatchTime(3600)).toBe('1 h 0 min');
    expect(formatWatchTime(3661)).toBe('1 h 1 min');
  });
});

describe('videoStats', () => {
  test('compte commencées / terminées et la moyenne', () => {
    const stats = videoStats([
      { completionPercent: 100, status: 'completed' },
      { completionPercent: 40, status: 'in_progress' },
      { completionPercent: 0, status: 'not_started' },
    ]);
    expect(stats).toEqual({ started: 2, completed: 1, averagePercent: 47 });
  });
  test('liste vide -> tout à 0', () => {
    expect(videoStats([])).toEqual({ started: 0, completed: 0, averagePercent: 0 });
  });
});

import { summarizeSubjectProgress } from './progress-summary';

describe('summarizeSubjectProgress', () => {
  test('agrège % + statut + compteurs par matière', () => {
    const r = summarizeSubjectProgress(
      [
        { id: 1, name: 'Maths' },
        { id: 2, name: 'Histoire' },
      ],
      { 1: [100, 50], 2: [] },
    );
    expect(r[0]).toEqual({
      subjectId: 1,
      name: 'Maths',
      completionPercent: 75,
      status: 'in_progress',
      videosTotal: 2,
      videosCompleted: 1,
    });
    expect(r[1]).toMatchObject({ completionPercent: 0, status: 'not_started', videosTotal: 0 });
  });
});
