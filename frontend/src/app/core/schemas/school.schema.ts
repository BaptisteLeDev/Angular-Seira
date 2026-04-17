import { z } from 'zod';

export const SchoolSchema = z.object({
  '@id': z.string().optional(),
  '@type': z.string().optional(),
  id: z.number().int(),
  name: z.string(),
  slug: z.string().optional(),
  /** IRIs des classes liées à cette école */
  classrooms: z.array(z.string()).optional(),
  /** IRIs des utilisateurs de cette école */
  users: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type School = z.infer<typeof SchoolSchema>;

export const SchoolListSchema = z.array(SchoolSchema);
