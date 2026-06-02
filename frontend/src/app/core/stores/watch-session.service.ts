import { Injectable, inject } from '@angular/core';
import { WatchSessionApi } from '../api/watch-session.api';
import { ProgressStore } from './progress.store';

interface SessionState {
  validated: number;
  token: string | null;
  segEnd: number;
  inFlight: boolean;
  finished: boolean;
  seeded: boolean;
}

/**
 * Orchestre le visionnage certifié (clés temporelles) pour chaque vidéo.
 *
 * Machine à états pilotée par `track(videoId, cap, duration)`, appelé au fil de
 * la lecture : demande un token pour le segment courant, puis envoie un
 * heartbeat dès que le plafond vu atteint la fin du segment. Tout est
 * best-effort — un échec réseau/temporel ne bloque jamais la lecture, le
 * segment sera simplement re-tenté.
 */
@Injectable({ providedIn: 'root' })
export class WatchSessionService {
  private readonly api = inject(WatchSessionApi);
  private readonly progress = inject(ProgressStore);

  private readonly sessions = new Map<number, SessionState>();

  track(videoId: number, cap: number, duration: number): void {
    if (duration <= 0) return;
    const s = this.session(videoId);
    if (s.finished || s.inFlight) return;

    if (s.token === null) {
      if (s.validated >= duration) {
        s.finished = true;
        return;
      }
      s.inFlight = true;
      this.api.requestToken(videoId, s.validated).subscribe({
        next: (tok) => {
          s.token = tok.token;
          s.segEnd = tok.segEnd;
          s.inFlight = false;
        },
        error: () => {
          s.inFlight = false;
        },
      });
      return;
    }

    if (cap >= s.segEnd) {
      const token = s.token;
      s.token = null;
      s.inFlight = true;
      this.api.heartbeat(token).subscribe({
        next: (res) => {
          s.validated = res.validatedSeconds;
          s.inFlight = false;
          if (res.validatedSeconds >= duration) s.finished = true;
          this.progress.applyHeartbeat(videoId, res);
        },
        error: () => {
          // Token expiré / soumis trop tôt : on relâche, le prochain track
          // redemandera un token pour le même point validé.
          s.inFlight = false;
        },
      });
    }
  }

  /** Réinitialise l'état d'une vidéo (changement de source). */
  reset(videoId: number): void {
    this.sessions.delete(videoId);
  }

  private session(videoId: number): SessionState {
    let s = this.sessions.get(videoId);
    if (!s) {
      const baseline = this.progress.byVideoId()[videoId]?.watchedSeconds ?? 0;
      s = { validated: baseline, token: null, segEnd: 0, inFlight: false, finished: false, seeded: true };
      this.sessions.set(videoId, s);
    }
    return s;
  }
}
