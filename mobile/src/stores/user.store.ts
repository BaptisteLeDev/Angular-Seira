import { create } from 'zustand';
import { UserApi } from '@src/api/user.api';
import type { UserListItem, UserRole } from '@src/schemas/user.schema';

type Status = 'idle' | 'loading' | 'error';

type Scope = {
  role?: UserRole;
  schoolId?: number | null;
};

type UserState = {
  items: readonly UserListItem[];
  status: Status;
  error: string | null;
  currentScope: Scope | null;
  load: (scope?: Scope, force?: boolean) => Promise<void>;
};

function sameScope(a: Scope | null, b: Scope): boolean {
  if (!a) return false;
  return a.role === b.role && (a.schoolId ?? null) === (b.schoolId ?? null);
}

export const useUserStore = create<UserState>((set, get) => ({
  items: [],
  status: 'idle',
  error: null,
  currentScope: null,

  async load(scope = {}, force = false) {
    const { status, currentScope } = get();
    if (!force && status === 'loading') return;
    if (!force && sameScope(currentScope, scope) && status === 'idle') return;

    set({ status: 'loading', error: null, currentScope: scope });
    try {
      const result = await UserApi.list(scope);
      set({ items: result, status: 'idle' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de charger les utilisateurs.';
      set({ status: 'error', error: message });
    }
  },
}));
