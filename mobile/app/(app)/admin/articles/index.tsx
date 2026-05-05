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
import { useFormationStore } from '@src/stores/formation.store';
import type { Formation } from '@src/schemas/formation.schema';

export default function AdminArticlesScreen() {
  return (
    <RoleGate allowed={['admin']}>
      <Body />
    </RoleGate>
  );
}

function Body() {
  const router = useRouter();
  const items = useFormationStore((s) => s.items);
  const status = useFormationStore((s) => s.status);
  const error = useFormationStore((s) => s.error);
  const load = useFormationStore((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ScreenShell
      back
      backFallback="/admin"
      eyebrow="Administration"
      title="Tous les contenus"
      subtitle="Choisissez une formation pour voir ses chapitres et articles."
    >
      {status === 'loading' ? (
        <LoadingView />
      ) : error ? (
        <ErrorCard message={error} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="library-outline"
          title="Aucune formation"
          description="Aucune formation enregistrée pour le moment."
        />
      ) : (
        <SearchableList<Formation>
          data={items}
          searchKeys={['name']}
          keyExtractor={(f) => String(f.id)}
          placeholder="Rechercher une formation…"
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item: formation }) => {
            const chapterCount = formation.chapters?.length ?? 0;
            return (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/admin/articles/[formationId]',
                    params: { formationId: String(formation.id) },
                  })
                }
                className="flex-row items-center gap-4 squircle-xl bg-surface-container p-5 ghost-border"
              >
                <View className="size-11 items-center justify-center squircle-lg bg-primary/10">
                  <Icon name="library-outline" size={22} color="#7bd0ff" />
                </View>
                <View className="flex-1">
                  <Text className="font-headline text-base font-bold text-on-surface">
                    {formation.name}
                  </Text>
                  <Text className="text-sm text-on-surface-variant">
                    {chapterCount} chapitre{chapterCount > 1 ? 's' : ''}
                  </Text>
                </View>
                <Icon name="chevron-forward" size={18} color="#a1a1aa" />
              </Pressable>
            );
          }}
        />
      )}
    </ScreenShell>
  );
}
