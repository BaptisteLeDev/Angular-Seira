import { computeCap, deriveStatus, aggregatePercent } from './video-progress';

describe('computeCap', () => {
  it('monte en lecture continue', () => {
    expect(computeCap(10, 11)).toBe(11);
  });
  it('bloque un saut avant au-delà de la tolérance', () => {
    expect(computeCap(10, 30)).toBe(10);
  });
  it('autorise le recul (renvoie le plafond inchangé)', () => {
    expect(computeCap(10, 4)).toBe(10);
  });
  it('tolère une petite avance (<= 1s)', () => {
    expect(computeCap(10, 10.9)).toBe(10.9);
  });
});

describe('deriveStatus', () => {
  it('completed à >= 95%', () => {
    expect(deriveStatus(95)).toBe('completed');
    expect(deriveStatus(100)).toBe('completed');
  });
  it('in_progress entre 0 (exclu) et 95%', () => {
    expect(deriveStatus(94.9)).toBe('in_progress');
    expect(deriveStatus(0.1)).toBe('in_progress');
  });
  it('not_started à 0%', () => {
    expect(deriveStatus(0)).toBe('not_started');
  });
});

describe('aggregatePercent', () => {
  it('moyenne simple', () => {
    expect(aggregatePercent([0, 100])).toBe(50);
  });
  it('liste vide -> 0 (pas de NaN)', () => {
    expect(aggregatePercent([])).toBe(0);
  });
  it('arrondi entier', () => {
    expect(aggregatePercent([33.3, 33.3, 33.3])).toBe(33);
  });
});
