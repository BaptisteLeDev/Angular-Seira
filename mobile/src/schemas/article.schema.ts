import { z } from 'zod';

export const ContentTypeSchema = z.enum(['video', 'pdf', 'markdown', 'link', 'file']);
export type ContentType = z.infer<typeof ContentTypeSchema>;

export const ArticleSchema = z.object({
  '@id': z.string().optional(),
  '@type': z.string().optional(),
  id: z.number().int(),
  videoId: z.number().int().nullable().optional(),
  chapterId: z.number().int().optional(),
  createdBy: z.number().int().nullable().optional(),
  type: ContentTypeSchema,
  title: z.string(),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  filePath: z.string().nullable().optional(),
  durationSeconds: z.number().int().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isPublished: z.boolean().optional(),
});

export type Article = z.infer<typeof ArticleSchema>;
export const ArticleListSchema = z.array(ArticleSchema);
