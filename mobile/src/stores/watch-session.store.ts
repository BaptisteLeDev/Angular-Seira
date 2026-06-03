import { create } from 'zustand';
import { WatchSessionApi } from '@src/api/watch-session.api';
import { useProgressStore } from './progress.store';

type Session = {
  validated: number;
  token: string | null;
  segEnd: number;
  inFlight: boolean;
  finished: boolean;
};

type WatchSessionState = {
  sessions: Record<number, Session>;
  track: (videoId: number, cap: number, duration: number) => Promise<void>;
  reset: (videoId: number) => void;
  resetAll: () => void;
};

/**
 * Visionnage certifié (clés temporelles) côté mobile.
 *
 * `track(videoId, cap, duration)` est appelé au fil de la lecture : il demande
 * un token pour le segment courant, puis envoie un heartbeat dès que le
 * plafond vu atteint la fin du segment. Best-effort : un échec n'interrompt
 * jamais la lecture, le segment sera re-tenté.
 */
export const useWatchSessionStore = create<WatchSessionState>((set, get) => ({
  sessions: {},

  async track(videoId, cap, duration) {
    if (duration <= 0) return;

    let session = get().sessions[videoId];
    if (!session) {
      const baseline = useProgressStore.getState().byVideoId[videoId]?.watchedSeconds ?? 0;
      session = { validated: baseline, token: null, segEnd: 0, inFlight: false, finished: false };
      set((s) => ({ sessions: { ...s.sessions, [videoId]: session! } }));
    }

    if (session.finished || session.inFlight) return;

    const patch = (p: Partial<Session>) =>
      set((s) => ({ sessions: { ...s.sessions, [videoId]: { ...s.sessions[videoId], ...p } } }));

    if (session.token === null) {
      if (session.validated >= duration) {
        patch({ finished: true });
        return;
      }
      patch({ inFlight: true });
      try {
        const tok = await WatchSessionApi.requestToken(videoId, session.validated);
        patch({ token: tok.token, segEnd: tok.segEnd });
      } catch {
        // best-effort : on réessaiera au prochain track
      } finally {
        patch({ inFlight: false });
      }
      return;
    }

    if (cap >= session.segEnd) {
      const token = session.token;
      patch({ token: null, inFlight: true });
      try {
        const res = await WatchSessionApi.heartbeat(token);
        patch({ validated: res.validatedSeconds, finished: res.validatedSeconds >= duration });
        useProgressStore.getState().applyHeartbeat(videoId, res);
      } catch {
        // token expiré / trop tôt : on redemandera au prochain track
      } finally {
        patch({ inFlight: false });
      }
    }
  },

  reset(videoId) {
    set((s) => {
      const next = { ...s.sessions };
      delete next[videoId];
      return { sessions: next };
    });
  },

  resetAll() {
    set({ sessions: {} });
  },
}));
