import { z } from 'zod';

export const VideoSchema = z.object({
  '@id': z.string().optional(),
  '@type': z.string().optional(),
  id: z.number().int(),
  title: z.string(),
  description: z.string().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  durationSeconds: z.number().int().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isPublished: z.boolean().optional(),
  chapter: z.string().optional(),
});

export type Video = z.infer<typeof VideoSchema>;
export const VideoListSchema = z.array(VideoSchema);
