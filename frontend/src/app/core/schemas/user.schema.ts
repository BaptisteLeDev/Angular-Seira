import { z } from 'zod';

export const UserRoleSchema = z.enum(['admin', 'teacher', 'student']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.string(),
  role: UserRoleSchema,
  schoolId: z.number().int().nullable().optional(),
});

export type User = z.infer<typeof UserSchema>;
