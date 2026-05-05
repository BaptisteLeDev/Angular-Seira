import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { RoleGate } from '@src/ui/RoleGate';
import { ScreenShell } from '@src/ui/ScreenShell';
import { LoadingView } from '@src/ui/LoadingView';
import { ErrorCard } from '@src/ui/ErrorCard';
import { EmptyState } from '@src/ui/EmptyState';
import { Icon } from '@src/ui/Icon';
import { SearchBar, useFuzzySearch } from '@src/ui/search';
import { SchoolApi } from '@src/api/school.api';
import { ClassroomApi } from '@src/api/classroom.api';
import type { School } from '@src/schemas/school.schema';
import type { Classroom } from '@src/schemas/classroom.schema';

export default function AdminSchoolDetailScreen() {
  return (
    <RoleGate allowed={['admin']}>
      <Body />
    </RoleGate>
  );
}

type Status = 'loading' | 'idle' | 'error';

function Body() {
  const { schoolId } = useLocalSearchParams<{ schoolId: string }>();
  const id = Number(schoolId);

  const [school, setSchool] = useState<School | null>(null);
  const [classrooms, setClassrooms] = useState<readonly Classroom[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [query, setQuery] = useState('');

  const filteredClassrooms = useFuzzySearch(classrooms, ['name'], query);

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    setError(null);

    Promise.all([SchoolApi.getById(id), ClassroomApi.list({ schoolId: id })])
      .then(([s, c]) => {
        if (!alive) return;
        setSchool(s);
        setClassrooms(c);
        setStatus('idle');
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'Erreur');
        setStatus('error');
      });

    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <ScreenShell
      back
      backFallback="/admin/schools"
      eyebrow="École"
      title={school?.name ?? 'Détail école'}
      subtitle="Classes rattachées à cet établissement."
    >
      {status === 'loading' ? (
        <LoadingView />
      ) : error ? (
        <ErrorCard message={error} />
      ) : (
        <View className="gap-4">
          <View className="flex-row items-center gap-3 squircle-xl bg-surface-container p-4 ghost-border">
            <View className="size-10 items-center justify-center squircle-lg bg-primary/10">
              <Icon name="business-outline" size={20} color="#7bd0ff" />
            </View>
            <View className="flex-1">
              <Text className="font-headline text-base font-bold text-on-surface">
                {classrooms.length} classe(s)
              </Text>
              <Text className="text-sm text-on-surface-variant">
                Identifiant interne #{school?.id}
              </Text>
            </View>
          </View>

          {classrooms.length === 0 ? (
            <EmptyState
              icon="school-outline"
              title="Aucune classe"
              description="Cette école n'a pas encore de classes."
            />
          ) : (
            <>
              <SearchBar
                value={query}
                onChangeText={setQuery}
                placeholder="Rechercher une classe…"
              />
              {filteredClassrooms.length === 0 ? (
                <EmptyState
                  icon="search-outline"
                  title="Aucun résultat"
                  description="Essayez un autre terme."
                />
              ) : (
                <View className="gap-3">
                  {filteredClassrooms.map((c) => (
                    <View
                      key={c.id}
                      className="flex-row items-center gap-4 squircle-xl bg-surface-container p-4 ghost-border"
                    >
                      <View className="size-10 items-center justify-center squircle-lg bg-primary/10">
                        <Icon name="school-outline" size={20} color="#7bd0ff" />
                      </View>
                      <View className="flex-1">
                        <Text className="font-headline text-base font-bold text-on-surface">
                          {c.name}
                        </Text>
                        <Text className="text-xs text-on-surface-variant">Classe #{c.id}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      )}
    </ScreenShell>
  );
}
