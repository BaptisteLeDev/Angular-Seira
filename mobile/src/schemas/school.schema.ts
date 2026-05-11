import { z } from 'zod';

export const SchoolSchema = z.object({
  '@id': z.string().optional(),
  '@type': z.string().optional(),
  id: z.number().int(),
  name: z.string(),
  slug: z.string().optional(),
  classrooms: z.array(z.string()).optional(),
});
export type School = z.infer<typeof SchoolSchema>;
