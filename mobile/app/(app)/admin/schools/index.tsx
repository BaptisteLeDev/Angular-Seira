import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { RoleGate } from '@src/ui/RoleGate';
import { ScreenShell } from '@src/ui/ScreenShell';
import { LoadingView } from '@src/ui/LoadingView';
import { ErrorCard } from '@src/ui/ErrorCard';
import { EmptyState } from '@src/ui/EmptyState';
import { Icon } from '@src/ui/Icon';
import { SearchableList } from '@src/ui/search';
import { useSchoolStore } from '@src/stores/school.store';
import type { School } from '@src/schemas/school.schema';

export default function AdminSchoolsScreen() {
  return (
    <RoleGate allowed={['admin']}>
      <Body />
    </RoleGate>
  );
}

function Body() {
  const router = useRouter();
  const items = useSchoolStore((s) => s.items);
  const status = useSchoolStore((s) => s.status);
  const error = useSchoolStore((s) => s.error);
  const load = useSchoolStore((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ScreenShell
      back
      eyebrow="Administration"
      title="Toutes les écoles"
      subtitle="Liste globale des établissements de la plateforme."
    >
      {status === 'loading' ? (
        <LoadingView />
      ) : error ? (
        <ErrorCard message={error} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="business-outline"
          title="Aucune école"
          description="Aucun établissement enregistré pour le moment."
        />
      ) : (
        <SearchableList<School>
          data={items}
          searchKeys={['name']}
          keyExtractor={(s) => String(s.id)}
          placeholder="Rechercher une école…"
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item: school }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/admin/schools/[schoolId]',
                  params: { schoolId: String(school.id) },
                })
              }
              className="flex-row items-center gap-4 squircle-xl bg-surface-container p-5 ghost-border"
            >
              <View className="size-11 items-center justify-center squircle-lg bg-primary/10">
                <Icon name="business-outline" size={22} color="#7bd0ff" />
              </View>
              <View className="flex-1">
                <Text className="font-headline text-base font-bold text-on-surface">
                  {school.name}
                </Text>
                {school.classrooms ? (
                  <Text className="text-sm text-on-surface-variant">
                    {school.classrooms.length} classe(s)
                  </Text>
                ) : null}
              </View>
              <Icon name="chevron-forward" size={18} color="#a1a1aa" />
            </Pressable>
          )}
        />
      )}
    </ScreenShell>
  );
}
