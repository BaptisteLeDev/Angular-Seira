import { create } from 'zustand';
import { HttpError } from '@src/api/client';
import { iriToId } from '@src/utils/iri';
import { VideoProgressApi, type ProgressPayload } from '@src/api/video-progress.api';
import type { ProgressStatus } from '@src/utils/video-progress';
import type { HeartbeatResult } from '@src/schemas/watch-session.schema';

type Entry = {
  id: number | null;
  watchedSeconds: number;
  completionPercent: number;
  status: ProgressStatus;
};

type ProgressState = {
  byVideoId: Record<number, Entry>;
  hydrated: boolean;
  inFlight: Record<number, boolean>;

  hydrate: (force?: boolean) => Promise<void>;
  report: (videoId: number, payload: ProgressPayload) => Promise<void>;
  applyHeartbeat: (videoId: number, result: HeartbeatResult) => void;
};

export const useProgressStore = create<ProgressState>((set, get) => ({
  byVideoId: {},
  hydrated: false,
  inFlight: {},

  async hydrate(force = false) {
    if (!force && get().hydrated) return;
    try {
      const rows = await VideoProgressApi.list();
      const byVideoId: Record<number, Entry> = {};
      for (const r of rows) {
        const vid = r.video ? iriToId(r.video) : r.videoId;
        if (!vid) continue;
        byVideoId[vid] = {
          id: r.id,
          watchedSeconds: r.watchedSecondsValidated ?? 0,
          completionPercent: r.completionPercent ?? 0,
          status: r.status ?? 'not_started',
        };
      }
      set({ byVideoId, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  async report(videoId, payload) {
    if (get().inFlight[videoId]) return;
    set((s) => ({ inFlight: { ...s.inFlight, [videoId]: true } }));

    const applyLocal = (id: number | null) =>
      set((s) => ({
        byVideoId: {
          ...s.byVideoId,
          [videoId]: {
            id,
            watchedSeconds: payload.watchedSecondsValidated,
            completionPercent: payload.completionPercent,
            status: payload.status,
          },
        },
      }));

    try {
      const known = get().byVideoId[videoId];
      if (known?.id != null) {
        await VideoProgressApi.update(known.id, payload);
        applyLocal(known.id);
      } else {
        try {
          const created = await VideoProgressApi.create(videoId, payload);
          applyLocal(created.id);
        } catch (err) {
          if (err instanceof HttpError && err.status === 409) {
            const rows = await VideoProgressApi.list();
            const match = rows.find((r) => (r.video ? iriToId(r.video) : r.videoId) === videoId);
            if (match) {
              await VideoProgressApi.update(match.id, payload);
              applyLocal(match.id);
            }
          } else {
            throw err;
          }
        }
      }
    } catch {
      // 401/403/422/réseau : best-effort, ne bloque pas la lecture
    } finally {
      set((s) => {
        const next = { ...s.inFlight };
        delete next[videoId];
        return { inFlight: next };
      });
    }
  },

  applyHeartbeat(videoId, result) {
    set((s) => ({
      byVideoId: {
        ...s.byVideoId,
        [videoId]: {
          id: s.byVideoId[videoId]?.id ?? null,
          watchedSeconds: result.validatedSeconds,
          completionPercent: result.completionPercent,
          status: result.status,
        },
      },
    }));
  },

}));
