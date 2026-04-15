import { z } from 'zod';

export const ChapitreSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  order: z.number().int(),
  formation_id: z.number().int(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export type Chapitre = z.infer<typeof ChapitreSchema>;

export const ChapitreListSchema = z.array(ChapitreSchema);
