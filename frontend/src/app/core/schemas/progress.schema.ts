import { z } from 'zod';

/** Statut de progression partagé vidéo / chapitre. */
export const ProgressStatusSchema = z.enum(['not_started', 'in_progress', 'completed']);

export const VideoProgressSchema = z.object({
  '@id': z.string().optional(),
  '@type': z.string().optional(),
  id: z.number().int(),
  /** IRI "/api/videos/{n}" */
  video: z.string().optional(),
  videoId: z.number().int().optional(),
  watchedSecondsValidated: z.coerce.number().int().default(0),
  completionPercent: z.coerce.number().default(0),
  status: ProgressStatusSchema.default('not_started'),
  lastSeenAt: z.string().nullable().optional(),
});

export const ChapterProgressSchema = z.object({
  '@id': z.string().optional(),
  '@type': z.string().optional(),
  id: z.number().int(),
  /** IRI "/api/chapters/{n}" */
  chapter: z.string().optional(),
  chapterId: z.number().int().optional(),
  completionPercent: z.coerce.number().default(0),
  status: ProgressStatusSchema.default('not_started'),
  lastSeenAt: z.string().nullable().optional(),
});

export type VideoProgress = z.infer<typeof VideoProgressSchema>;
export type ChapterProgress = z.infer<typeof ChapterProgressSchema>;
