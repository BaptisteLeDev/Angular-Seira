import { z } from 'zod';

/**
 * Nommé `Classroom` pour éviter la collision avec le mot-clé DOM `Class`.
 */
export const ClassroomSchema = z.object({
  '@id': z.string().optional(),
  '@type': z.string().optional(),
  id: z.number().int(),
  name: z.string(),
  slug: z.string().optional(),
  level: z.string().nullable().optional(),
  /** IRI de l'école parente */
  school: z.string().optional(),
  /** IRIs des élèves */
  students: z.array(z.string()).optional(),
  /** IRIs des formations (subjects) */
  subjects: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Classroom = z.infer<typeof ClassroomSchema>;

export const ClassroomListSchema = z.array(ClassroomSchema);
