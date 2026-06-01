import { z } from 'zod';

export const VideoProgressStatusSchema = z.enum([
  'not_started',
  'in_progress',
  'completed',
]);

export const VideoProgressSchema = z.object({
  '@id': z.string().optional(),
  id: z.number().int(),
  video: z.string().optional(), // IRI "/api/videos/{n}"
  videoId: z.number().int().optional(),
  watchedSecondsValidated: z.coerce.number().int().default(0),
  completionPercent: z.coerce.number().default(0),
  status: VideoProgressStatusSchema.default('not_started'),
  lastSeenAt: z.string().nullable().optional(),
});

export type VideoProgress = z.infer<typeof VideoProgressSchema>;
export type VideoProgressStatus = z.infer<typeof VideoProgressStatusSchema>;
export const VideoProgressListSchema = z.array(VideoProgressSchema);
