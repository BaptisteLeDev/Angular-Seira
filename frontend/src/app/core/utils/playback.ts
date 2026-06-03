/** Vitesse de lecture maximale autorisée (anti-triche : pas d'accélération). */
export const MAX_PLAYBACK_RATE = 2;

/**
 * Plafonne la vitesse de lecture à {@link MAX_PLAYBACK_RATE}. Une valeur nulle,
 * négative ou non finie retombe sur la vitesse normale (1x).
 */
export function clampPlaybackRate(rate: number, max = MAX_PLAYBACK_RATE): number {
  if (!Number.isFinite(rate) || rate <= 0) return 1;
  return Math.min(rate, max);
}
