import { z } from 'zod';

export const FormationSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  description: z.string().nullable().optional(),
  user_id: z.number().int().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export type Formation = z.infer<typeof FormationSchema>;

export const FormationListSchema = z.array(FormationSchema);
