import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { RoleGate } from '@src/ui/RoleGate';
import { ScreenShell } from '@src/ui/ScreenShell';
import { LoadingView } from '@src/ui/LoadingView';
import { ErrorCard } from '@src/ui/ErrorCard';
import { EmptyState } from '@src/ui/EmptyState';
import { Icon } from '@src/ui/Icon';
import { SearchBar, useFuzzySearch } from '@src/ui/search';
import { useUserStore } from '@src/stores/user.store';
import type { UserListItem, UserRole } from '@src/schemas/user.schema';

type RoleFilter = 'all' | UserRole;

const FILTERS: readonly { id: RoleFilter; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'admin', label: 'Admins' },
  { id: 'teacher', label: 'Professeurs' },
  { id: 'student', label: 'Élèves' },
];

export default function AdminUsersScreen() {
  return (
    <RoleGate allowed={['admin']}>
      <Body />
    </RoleGate>
  );
}

function Body() {
  const items = useUserStore((s) => s.items);
  const status = useUserStore((s) => s.status);
  const error = useUserStore((s) => s.error);
  const load = useUserStore((s) => s.load);

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  useEffect(() => {
    void load({}, true);
  }, [load]);

  const byRole = useMemo<readonly UserListItem[]>(() => {
    if (roleFilter === 'all') return items;
    return items.filter((u) => u.role === roleFilter);
  }, [items, roleFilter]);

  const filtered = useFuzzySearch(byRole, ['name', 'email'], query);

  return (
    <ScreenShell
      back
      eyebrow="Administration"
      title="Tous les utilisateurs"
      subtitle="Annuaire global, filtrable par rôle."
    >
      {status === 'loading' ? (
        <LoadingView />
      ) : error ? (
        <ErrorCard message={error} />
      ) : (
        <View className="gap-4">
          <FilterRow value={roleFilter} onChange={setRoleFilter} />
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher un utilisateur…"
          />
          {filtered.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title="Aucun résultat"
              description="Aucun utilisateur ne correspond à ces critères."
            />
          ) : (
            <View className="gap-3">
              {filtered.map((u) => (
                <UserRow key={u.id} user={u} />
              ))}
            </View>
          )}
        </View>
      )}
    </ScreenShell>
  );
}

function FilterRow({
  value,
  onChange,
}: {
  value: RoleFilter;
  onChange: (v: RoleFilter) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingRight: 8 }}
    >
      {FILTERS.map((f) => {
        const active = f.id === value;
        return (
          <Pressable
            key={f.id}
            onPress={() => onChange(f.id)}
            className={
              active
                ? 'squircle-lg bg-primary px-4 py-2'
                : 'squircle-lg bg-surface-container px-4 py-2 ghost-border'
            }
          >
            <Text
              className={
                active
                  ? 'font-headline text-xs font-bold uppercase tracking-widest text-on-primary'
                  : 'font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant'
              }
            >
              {f.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function UserRow({ user }: { user: UserListItem }) {
  const roleLabel =
    user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'Professeur' : 'Élève';
  return (
    <View className="flex-row items-center gap-4 squircle-xl bg-surface-container p-4 ghost-border">
      <View className="size-10 items-center justify-center rounded-full bg-primary/10">
        <Icon name="person-outline" size={20} color="#7bd0ff" />
      </View>
      <View className="flex-1">
        <Text className="font-headline text-base font-bold text-on-surface">
          {user.name?.trim() || user.email}
        </Text>
        <Text className="text-sm text-on-surface-variant">{user.email}</Text>
      </View>
      <Text className="font-headline text-xs font-bold uppercase tracking-widest text-primary">
        {roleLabel}
      </Text>
    </View>
  );
}
