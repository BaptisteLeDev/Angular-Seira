import { describe, it, expect } from 'vitest';
import {
  clampPercent,
  deriveStatus,
  aggregatePercent,
  buildVideoProgressPayload,
  buildChapterProgressPayload,
  shouldFlush,
  computeCap,
  COMPLETED_THRESHOLD,
} from './video-progress';

describe('computeCap', () => {
  it('monte en lecture continue', () => {
    expect(computeCap(0, 0.5)).toBe(0.5);
    expect(computeCap(10, 10.8)).toBe(10.8);
  });
  it('bloque un saut avant au-delà de la tolérance (renvoie le plafond)', () => {
    expect(computeCap(10, 40)).toBe(10);
  });
  it('ignore les reculs (renvoie le plafond)', () => {
    expect(computeCap(10, 3)).toBe(10);
  });
});

describe('clampPercent', () => {
  it('borne entre 0 et 100', () => {
    expect(clampPercent(-5)).toBe(0);
    expect(clampPercent(150)).toBe(100);
    expect(clampPercent(42)).toBe(42);
  });
  it('valeur non finie -> 0', () => {
    expect(clampPercent(NaN)).toBe(0);
    expect(clampPercent(Infinity)).toBe(100);
  });
});

describe('deriveStatus', () => {
  it('0% -> not_started', () => {
    expect(deriveStatus(0)).toBe('not_started');
  });
  it('entre 1 et le seuil -> in_progress', () => {
    expect(deriveStatus(1)).toBe('in_progress');
    expect(deriveStatus(COMPLETED_THRESHOLD - 1)).toBe('in_progress');
  });
  it('au-delà du seuil -> completed', () => {
    expect(deriveStatus(COMPLETED_THRESHOLD)).toBe('completed');
    expect(deriveStatus(100)).toBe('completed');
  });
});

describe('aggregatePercent', () => {
  it('moyenne entière', () => {
    expect(aggregatePercent([50, 100])).toBe(75);
    expect(aggregatePercent([33, 33, 34])).toBe(33);
  });
  it('liste vide -> 0', () => {
    expect(aggregatePercent([])).toBe(0);
  });
});

describe('buildVideoProgressPayload', () => {
  const now = '2026-06-02T10:00:00.000Z';

  it('cap 0 -> not_started, 0%', () => {
    expect(buildVideoProgressPayload(0, 100, now)).toEqual({
      watchedSecondsValidated: 0,
      completionPercent: 0,
      status: 'not_started',
      lastSeenAt: now,
    });
  });

  it('lecture partielle -> in_progress, % arrondi, secondes plancher', () => {
    expect(buildVideoProgressPayload(50.9, 100, now)).toEqual({
      watchedSecondsValidated: 50,
      completionPercent: 51,
      status: 'in_progress',
      lastSeenAt: now,
    });
  });

  it('quasi-fin -> completed', () => {
    expect(buildVideoProgressPayload(98, 100, now)).toEqual({
      watchedSecondsValidated: 98,
      completionPercent: 98,
      status: 'completed',
      lastSeenAt: now,
    });
  });

  it('durée inconnue (<=0) -> 0% not_started', () => {
    expect(buildVideoProgressPayload(30, 0, now)).toEqual({
      watchedSecondsValidated: 30,
      completionPercent: 0,
      status: 'not_started',
      lastSeenAt: now,
    });
  });
});

describe('shouldFlush', () => {
  it('déclenche après assez de nouvelles secondes vues (pas continu)', () => {
    expect(shouldFlush(8, 0)).toBe(true);
    expect(shouldFlush(7.9, 0)).toBe(false);
    expect(shouldFlush(16, 8)).toBe(true);
    expect(shouldFlush(12, 8)).toBe(false);
  });
  it('jamais en arrière', () => {
    expect(shouldFlush(3, 8)).toBe(false);
  });
});

describe('buildChapterProgressPayload', () => {
  it('agrège les % des vidéos du chapitre', () => {
    expect(buildChapterProgressPayload(10, [50, 100])).toEqual({
      chapterId: 10,
      completionPercent: 75,
      status: 'in_progress',
    });
  });

  it('toutes les vidéos finies -> completed', () => {
    expect(buildChapterProgressPayload(10, [100, 96])).toEqual({
      chapterId: 10,
      completionPercent: 98,
      status: 'completed',
    });
  });

  it('aucune vidéo vue -> not_started', () => {
    expect(buildChapterProgressPayload(10, [0, 0])).toEqual({
      chapterId: 10,
      completionPercent: 0,
      status: 'not_started',
    });
  });
});
