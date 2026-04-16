import { z } from 'zod';

/**
 * Subject backend = Formation cote front.
 * Les champs arrivent en camelCase depuis JSON-LD.
 * `chapters` contient les IRIs des chapitres lies (ex: "/api/chapters/1").
 */
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
