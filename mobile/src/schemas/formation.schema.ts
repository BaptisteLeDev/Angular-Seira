import { z } from 'zod';

export const FormationSchema = z.object({
  '@id': z.string().optional(),
  '@type': z.string().optional(),
  id: z.number().int(),
  name: z.string(),
  description: z.string().nullable().optional(),
  expectedHours: z.number().int().optional(),
  school: z.string().optional(),
  teacher: z.string().optional(),
  classrooms: z.array(z.string()).optional(),
  chapters: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Formation = z.infer<typeof FormationSchema>;
export const FormationListSchema = z.array(FormationSchema);
