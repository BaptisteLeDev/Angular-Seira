import { z } from 'zod';

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/**
 * Le login Sanctum renvoie un user minimal (email + role),
 * pas le profil complet. On appelle /auth/me ensuite.
 */
export const AuthResponseSchema = z.object({
  tokenType: z.string(),
  token: z.string(),
  user: z.object({
    email: z.string(),
    role: z.string(),
  }),
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
