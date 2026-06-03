import { apiRequest } from './client';
import {
  WatchTokenSchema,
  HeartbeatResultSchema,
  type WatchToken,
  type HeartbeatResult,
} from '@src/schemas/watch-session.schema';

/**
 * Flux anti-triche de visionnage certifié (clés temporelles).
 * `requestToken` AVANT un segment (~30 s), `heartbeat` APRÈS l'avoir vu.
 */
export const WatchSessionApi = {
  async requestToken(videoId: number, segmentStart: number): Promise<WatchToken> {
    const raw = await apiRequest<unknown>('/watch-sessions/request', {
      method: 'POST',
      body: { video_id: videoId, segment_start: segmentStart },
    });
    return WatchTokenSchema.parse(raw);
  },

  async heartbeat(token: string): Promise<HeartbeatResult> {
    const raw = await apiRequest<unknown>('/watch-sessions/heartbeat', {
      method: 'POST',
      body: { token },
    });
    return HeartbeatResultSchema.parse(raw);
  },
};
