import { z } from 'zod';
import { UserSchema, UserTypeSchema } from './user.schema';

export const LoginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RegisterRequestSchema = z
  .object({
    name: z.string().min(1),
    email: z.email(),
    password: z.string().min(6),
    password_confirmation: z.string().min(6),
    type: UserTypeSchema,
    classe_id: z.number().int().nullable().optional(),
  })
  .refine((value) => value.password === value.password_confirmation, {
    path: ['password_confirmation'],
    message: 'Les mots de passe ne correspondent pas.',
  });
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const AuthResponseSchema = z.object({
  message: z.string().optional(),
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number().int(),
  user: UserSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const RefreshResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number().int(),
});
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;
