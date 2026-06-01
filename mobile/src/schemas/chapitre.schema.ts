import { z } from 'zod';

export const ChapitreSchema = z.object({
  '@id': z.string().optional(),
  '@type': z.string().optional(),
  id: z.number().int(),
  title: z.string(),
  sortOrder: z.number().int(),
  subject: z.string().optional(),
  contents: z.array(z.string()).optional(),
  videos: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Chapitre = z.infer<typeof ChapitreSchema>;
export const ChapitreListSchema = z.array(ChapitreSchema);
