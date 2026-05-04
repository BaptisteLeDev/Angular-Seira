import { useAuthStore } from '@src/stores/auth.store';
import type { UserRole } from '@src/schemas/user.schema';

type Guard =
  | { status: 'allowed' }
  | { status: 'unauthenticated' }
  | { status: 'forbidden' };

export function useRoleGuard(allowed: readonly UserRole[]): Guard {
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.user?.role);

  if (!token) return { status: 'unauthenticated' };
  if (!role || !allowed.includes(role)) return { status: 'forbidden' };
  return { status: 'allowed' };
}
