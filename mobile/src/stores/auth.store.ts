import { create } from 'zustand';
import { AuthApi } from '@src/api/auth.api';
import { HttpError, TOKEN_KEY } from '@src/api/client';
import type { LoginRequest } from '@src/schemas/auth.schema';
import { UserSchema, type User } from '@src/schemas/user.schema';
import { storage } from '@src/utils/storage';

const USER_KEY = 'seira.auth.user';

type Status = 'idle' | 'loading' | 'error';

type AuthState = {
  user: User | null;
  token: string | null;
  status: Status;
  error: string | null;
  hydrated: boolean;
  isAuthenticated: () => boolean;
  hydrate: () => Promise<void>;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearSession: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  status: 'idle',
  error: null,
  hydrated: false,

  isAuthenticated: () => get().token !== null,

  async hydrate() {
    const [token, userRaw] = await Promise.all([
      storage.get(TOKEN_KEY),
      storage.get(USER_KEY),
    ]);

    let user: User | null = null;
    if (userRaw) {
      try {
        const parsed = UserSchema.safeParse(JSON.parse(userRaw));
        if (parsed.success) user = parsed.data;
      } catch {
        /* ignore */
      }
    }

    set({ token, user, hydrated: true });

    if (token) {
      try {
        const fresh = await AuthApi.me();
        set({ user: fresh });
        await storage.set(USER_KEY, JSON.stringify(fresh));
      } catch (err) {
        if (err instanceof HttpError && (err.status === 401 || err.status === 403)) {
          await get().clearSession();
        }
      }
    }
  },

  async login(payload) {
    set({ status: 'loading', error: null });
    try {
      const response = await AuthApi.login(payload);
      await storage.set(TOKEN_KEY, response.token);
      set({ token: response.token });

      const user = await AuthApi.me();
      await storage.set(USER_KEY, JSON.stringify(user));
      set({ user, status: 'idle' });
    } catch (err) {
      const message = toUserMessage(err);
      set({ status: 'error', error: message });
      throw new Error(message);
    }
  },

  async logout() {
    try {
      await AuthApi.logout();
    } catch {
      /* ignore network errors sur logout */
    }
    await get().clearSession();
  },

  async clearSession() {
    await Promise.all([storage.remove(TOKEN_KEY), storage.remove(USER_KEY)]);
    set({ token: null, user: null, status: 'idle', error: null });
  },
}));

function toUserMessage(error: unknown): string {
  if (error instanceof HttpError) {
    if (error.status === 0) return 'Serveur inaccessible.';
    if (error.status === 401 || error.status === 403) return 'Email ou mot de passe incorrect.';
    if (error.status === 422) return 'Email ou mot de passe incorrect.';
    return error.message || 'Erreur de connexion.';
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Erreur de connexion.';
}
