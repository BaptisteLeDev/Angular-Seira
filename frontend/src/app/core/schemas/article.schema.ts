import { z } from 'zod';

export const ArticleSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  content: z.string().nullable().optional(),
  order: z.number().int(),
  chapitre_id: z.number().int(),
  video_url: z.string().nullable().optional(),
  video_provider: z.string().nullable().optional(),
  video_id: z.string().nullable().optional(),
  duration_seconds: z.number().int().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export type Article = z.infer<typeof ArticleSchema>;

export const ArticleListSchema = z.array(ArticleSchema);
