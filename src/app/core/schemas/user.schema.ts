import { z } from 'zod';

export const UserTypeSchema = z.enum(['prof', 'ecole', 'etudiant']);
export type UserType = z.infer<typeof UserTypeSchema>;

export const UserSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.email(),
  type: UserTypeSchema,
  classe_id: z.number().int().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export type User = z.infer<typeof UserSchema>;
