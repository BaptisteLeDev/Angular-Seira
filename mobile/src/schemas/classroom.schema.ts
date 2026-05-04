import { z } from 'zod';

export const ClassroomSchema = z.object({
  '@id': z.string().optional(),
  '@type': z.string().optional(),
  id: z.number().int(),
  name: z.string(),
  level: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
  schoolId: z.number().int().nullable().optional(),
  school: z.string().nullable().optional(),
});
export type Classroom = z.infer<typeof ClassroomSchema>;
