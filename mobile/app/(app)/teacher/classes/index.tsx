import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { RoleGate } from '@src/ui/RoleGate';
import { ScreenShell } from '@src/ui/ScreenShell';
import { LoadingView } from '@src/ui/LoadingView';
import { ErrorCard } from '@src/ui/ErrorCard';
import { EmptyState } from '@src/ui/EmptyState';
import { Icon } from '@src/ui/Icon';
import { SearchableList } from '@src/ui/search';
import { ClassroomApi } from '@src/api/classroom.api';
import { useAuthStore } from '@src/stores/auth.store';
import { useFormationStore } from '@src/stores/formation.store';
import { safeIriToId } from '@src/utils/iri';
import type { Classroom } from '@src/schemas/classroom.schema';

export default function TeacherClassesScreen() {
  return (
    <RoleGate allowed={['teacher']}>
      <Body />
    </RoleGate>
  );
}

function Body() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const userSchoolId = useAuthStore((s) => s.user?.schoolId ?? null);

  const formations = useFormationStore((s) => s.items);
  const formationStatus = useFormationStore((s) => s.status);
  const loadFormations = useFormationStore((s) => s.load);

  const [classrooms, setClassrooms] = useState<readonly Classroom[]>([]);
  const [classroomError, setClassroomError] = useState<string | null>(null);
  const [classroomLoading, setClassroomLoading] = useState(true);

  useEffect(() => {
    void loadFormations();
  }, [loadFormations]);

  useEffect(() => {
    let alive = true;
    setClassroomLoading(true);
    ClassroomApi.list({ schoolId: userSchoolId })
      .then((c) => {
        if (alive) setClassrooms(c);
      })
      .catch((err: unknown) => {
        if (alive)
          setClassroomError(err instanceof Error ? err.message : 'Erreur de chargement.');
      })
      .finally(() => {
        if (alive) setClassroomLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [userSchoolId]);

  const teacherClassroomIds = useMemo<ReadonlySet<number>>(() => {
    const ids = new Set<number>();
    for (const f of formations) {
      if (safeIriToId(f.teacher) !== userId) continue;
      for (const iri of f.classrooms ?? []) {
        const id = safeIriToId(iri);
        if (id != null) ids.add(id);
      }
    }
    return ids;
  }, [formations, userId]);

  const myClassrooms = useMemo<readonly Classroom[]>(
    () => classrooms.filter((c) => teacherClassroomIds.has(c.id)),
    [classrooms, teacherClassroomIds],
  );

  const isLoading = classroomLoading || formationStatus === 'loading';

  return (
    <ScreenShell
      back
      eyebrow="Professeur"
      title="Mes classes"
      subtitle="Classes que vous encadrez via vos matières."
    >
      {isLoading ? (
        <LoadingView />
      ) : classroomError ? (
        <ErrorCard message={classroomError} />
      ) : myClassrooms.length === 0 ? (
        <EmptyState
          icon="people-circle-outline"
          title="Aucune classe"
          description="Vous n'êtes lié à aucune classe pour le moment."
        />
      ) : (
        <SearchableList<Classroom>
          data={myClassrooms}
          searchKeys={['name', 'level']}
          keyExtractor={(c) => String(c.id)}
          placeholder="Rechercher une classe…"
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item: c }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/teacher/classes/[id]',
                  params: { id: String(c.id) },
                })
              }
              className="flex-row items-center gap-4 squircle-xl bg-surface-container p-5 ghost-border"
            >
              <View className="size-11 items-center justify-center squircle-lg bg-primary/10">
                <Icon name="school-outline" size={22} color="#7bd0ff" />
              </View>
              <View className="flex-1">
                <Text className="font-headline text-base font-bold text-on-surface">
                  {c.name}
                </Text>
                {c.level ? (
                  <Text className="text-sm text-on-surface-variant">{c.level}</Text>
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
