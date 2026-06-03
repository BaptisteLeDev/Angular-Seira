import { z } from 'zod';
import { UserRoleSchema } from './user.schema';

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthResponseSchema = z.object({
  tokenType: z.string(),
  token: z.string(),
  user: z.object({
    email: z.string().email(),
    role: UserRoleSchema,
  }),
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
