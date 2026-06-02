export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export const COMPLETED_THRESHOLD = 95;
export const SEEK_TOLERANCE_SECONDS = 1;

/**
 * Plafond anti-skip : monte en lecture continue, bloque les sauts avant
 * au-delà de la tolérance, ignore les reculs (renvoie le plafond inchangé).
 */
export function computeCap(
  cap: number,
  currentTime: number,
  tolerance = SEEK_TOLERANCE_SECONDS,
): number {
  if (currentTime > cap + tolerance) return cap;
  return Math.max(cap, currentTime);
}

export function deriveStatus(percent: number): ProgressStatus {
  if (percent >= COMPLETED_THRESHOLD) return 'completed';
  if (percent > 0) return 'in_progress';
  return 'not_started';
}

/** Moyenne entière d'une liste de pourcentages ; liste vide -> 0. */
export function aggregatePercent(percents: number[]): number {
  if (percents.length === 0) return 0;
  const sum = percents.reduce((a, b) => a + b, 0);
  return Math.round(sum / percents.length);
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}
