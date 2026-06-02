import { z } from 'zod';

/** Réponse de `POST /watch-sessions/request` (snake_case → camelCase). */
export const WatchTokenSchema = z
  .object({
    token: z.string(),
    seg_start: z.number().int(),
    seg_end: z.number().int(),
    expires_at: z.string(),
  })
  .transform((r) => ({
    token: r.token,
    segStart: r.seg_start,
    segEnd: r.seg_end,
    expiresAt: r.expires_at,
  }));

/** Réponse de `POST /watch-sessions/heartbeat`. */
export const HeartbeatResultSchema = z
  .object({
    validated_seconds: z.coerce.number().int(),
    segment_validated: z.coerce.number().int(),
    completion_percent: z.coerce.number(),
    status: z.enum(['not_started', 'in_progress', 'completed']),
  })
  .transform((r) => ({
    validatedSeconds: r.validated_seconds,
    segmentValidated: r.segment_validated,
    completionPercent: r.completion_percent,
    status: r.status,
  }));

export type WatchToken = z.infer<typeof WatchTokenSchema>;
export type HeartbeatResult = z.infer<typeof HeartbeatResultSchema>;
