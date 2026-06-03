import { z } from 'zod';
import { apiRequest } from './client';
import {
  VideoProgressSchema,
  type VideoProgress,
} from '@src/schemas/video-progress.schema';

export type ProgressPayload = {
  watchedSecondsValidated: number;
  completionPercent: number;
  status: 'not_started' | 'in_progress' | 'completed';
  lastSeenAt: string;
};

export const VideoProgressApi = {
  /** GET collection — tableau JSON simple (pas d'enveloppe Hydra) pour un élève. */
  async list(): Promise<VideoProgress[]> {
    const raw = await apiRequest<unknown>('/video-progress');
    const arr = Array.isArray(raw)
      ? raw
      : ((raw as { member?: unknown[] })?.member ?? []);
    return z.array(VideoProgressSchema).parse(arr);
  },

  /** POST — corps snake_case (DTO VideoProgressCreateInput). 409 si doublon. */
  async create(videoId: number, p: ProgressPayload): Promise<VideoProgress> {
    const raw = await apiRequest<unknown>('/video-progress', {
      method: 'POST',
      body: {
        // watched_seconds_validated certifié via heartbeat (watch-sessions).
        video_id: videoId,
        completion_percent: p.completionPercent,
        status: p.status,
        last_seen_at: p.lastSeenAt,
      },
    });
    return VideoProgressSchema.parse(raw);
  },

  /** PATCH — corps camelCase (modèle, pas de DTO). */
  async update(id: number, p: ProgressPayload): Promise<VideoProgress> {
    const raw = await apiRequest<unknown>(`/video-progress/${id}`, {
      method: 'PATCH',
      body: {
        completionPercent: p.completionPercent,
        status: p.status,
        lastSeenAt: p.lastSeenAt,
      },
    });
    return VideoProgressSchema.parse(raw);
  },
};
