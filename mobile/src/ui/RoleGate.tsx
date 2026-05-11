import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';

import { useRoleGuard } from '@src/utils/use-role-guard';
import type { UserRole } from '@src/schemas/user.schema';

type Props = {
  allowed: readonly UserRole[];
  children: ReactNode;
};

export function RoleGate({ allowed, children }: Props) {
  const guard = useRoleGuard(allowed);
  if (guard.status === 'unauthenticated') return <Redirect href="/home" />;
  if (guard.status === 'forbidden') return <Redirect href="/dashboard" />;
  return <>{children}</>;
}
