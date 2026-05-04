import { useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';

import { RoleGate } from '@src/ui/RoleGate';
import { ScreenShell } from '@src/ui/ScreenShell';
import { LoadingView } from '@src/ui/LoadingView';
import { ErrorCard } from '@src/ui/ErrorCard';
import { Icon } from '@src/ui/Icon';
import { useUserStore } from '@src/stores/user.store';
import type { UserListItem, UserRole } from '@src/schemas/user.schema';

export default function AdminUsersScreen() {
  return (
    <RoleGate allowed={['admin']}>
      <Body />
    </RoleGate>
  );
}

type Section = { role: UserRole; label: string; users: readonly UserListItem[] };

function Body() {
  const items = useUserStore((s) => s.items);
  const status = useUserStore((s) => s.status);
  const error = useUserStore((s) => s.error);
  const load = useUserStore((s) => s.load);

  useEffect(() => {
    void load({}, true);
  }, [load]);

  const sections = useMemo<readonly Section[]>(() => {
    const buckets: Record<UserRole, UserListItem[]> = {
      admin: [],
      teacher: [],
      student: [],
    };
    for (const u of items) buckets[u.role]?.push(u);
    return [
      { role: 'admin', label: 'Administrateurs', users: buckets.admin },
      { role: 'teacher', label: 'Professeurs', users: buckets.teacher },
      { role: 'student', label: 'Élèves', users: buckets.student },
    ];
  }, [items]);

  return (
    <ScreenShell
      back
      backFallback="/admin"
      eyebrow="Administration"
      title="Tous les utilisateurs"
      subtitle="Annuaire global, regroupé par rôle."
    >
      {status === 'loading' ? (
        <LoadingView />
      ) : error ? (
        <ErrorCard message={error} />
      ) : (
        <View className="gap-8">
          {sections.map((s) => (
            <SectionBlock key={s.role} section={s} />
          ))}
        </View>
      )}
    </ScreenShell>
  );
}

function SectionBlock({ section }: { section: Section }) {
  return (
    <View>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="font-headline text-xs font-bold uppercase tracking-[3px] text-primary">
          {section.label}
        </Text>
        <Text className="font-headline text-xs font-bold text-on-surface-variant">
          {section.users.length}
        </Text>
      </View>
      {section.users.length === 0 ? (
        <View className="squircle-xl bg-surface-container p-4 ghost-border">
          <Text className="text-sm text-on-surface-variant">Aucun utilisateur.</Text>
        </View>
      ) : (
        <View className="gap-3">
          {section.users.map((u) => (
            <View
              key={u.id}
              className="flex-row items-center gap-4 squircle-xl bg-surface-container p-4 ghost-border"
            >
              <View className="size-10 items-center justify-center rounded-full bg-primary/10">
                <Icon name="person-outline" size={20} color="#7bd0ff" />
              </View>
              <View className="flex-1">
                <Text className="font-headline text-base font-bold text-on-surface">
                  {u.name?.trim() || u.email}
                </Text>
                <Text className="text-sm text-on-surface-variant">{u.email}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
