import { apiRequest } from './client';
import { parseResponse } from './parse-response';
import {
  AuthResponseSchema,
  LoginRequestSchema,
  type AuthResponse,
  type LoginRequest,
} from '@src/schemas/auth.schema';
import { UserSchema, type User } from '@src/schemas/user.schema';

export const AuthApi = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const body = LoginRequestSchema.parse(payload);
    const raw = await apiRequest<unknown>('/auth/login', {
      method: 'POST',
      body,
      auth: false,
    });
    return parseResponse(AuthResponseSchema, raw);
  },

  async logout(): Promise<void> {
    await apiRequest<void>('/auth/logout', { method: 'POST', body: {} });
  },

  async me(): Promise<User> {
    const raw = await apiRequest<unknown>('/auth/me');
    return parseResponse(UserSchema, raw);
  },
};
