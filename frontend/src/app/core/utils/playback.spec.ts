import { describe, it, expect } from 'vitest';
import { clampPlaybackRate, MAX_PLAYBACK_RATE } from './playback';

describe('clampPlaybackRate', () => {
  it('laisse passer les vitesses normales et lentes', () => {
    expect(clampPlaybackRate(1)).toBe(1);
    expect(clampPlaybackRate(0.5)).toBe(0.5);
    expect(clampPlaybackRate(MAX_PLAYBACK_RATE)).toBe(MAX_PLAYBACK_RATE);
  });
  it('plafonne au-delà de 2x', () => {
    expect(clampPlaybackRate(2.5)).toBe(MAX_PLAYBACK_RATE);
    expect(clampPlaybackRate(16)).toBe(MAX_PLAYBACK_RATE);
  });
  it('valeur invalide ou non positive -> 1x', () => {
    expect(clampPlaybackRate(0)).toBe(1);
    expect(clampPlaybackRate(-1)).toBe(1);
    expect(clampPlaybackRate(NaN)).toBe(1);
  });
});
