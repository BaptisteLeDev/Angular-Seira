import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { RoleGate } from '@src/ui/RoleGate';
import { ScreenShell } from '@src/ui/ScreenShell';
import { LoadingView } from '@src/ui/LoadingView';
import { ErrorCard } from '@src/ui/ErrorCard';
import { EmptyState } from '@src/ui/EmptyState';
import { Icon } from '@src/ui/Icon';
import { SearchableList } from '@src/ui/search';
import { UserApi } from '@src/api/user.api';
import { useAuthStore } from '@src/stores/auth.store';
import { useFormationStore } from '@src/stores/formation.store';
import { safeIriToId } from '@src/utils/iri';
import type { UserListItem } from '@src/schemas/user.schema';

export default function TeacherStudentsScreen() {
  return (
    <RoleGate allowed={['teacher']}>
      <Body />
    </RoleGate>
  );
}

function Body() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const userSchoolId = useAuthStore((s) => s.user?.schoolId ?? null);

  const formations = useFormationStore((s) => s.items);
  const loadFormations = useFormationStore((s) => s.load);

  const [students, setStudents] = useState<readonly UserListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadFormations();
  }, [loadFormations]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    UserApi.list({ role: 'student', schoolId: userSchoolId })
      .then((s) => {
        if (alive) setStudents(s);
      })
      .catch((err: unknown) => {
        if (alive) setError(err instanceof Error ? err.message : 'Erreur');
      })
      .finally(() => {
        if (alive) setLoading(false);
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

  const myStudents = useMemo<readonly UserListItem[]>(
    () =>
      students.filter(
        (s) => s.classroomId != null && teacherClassroomIds.has(s.classroomId),
      ),
    [students, teacherClassroomIds],
  );

  return (
    <ScreenShell
      back
      eyebrow="Professeur"
      title="Mes élèves"
      subtitle="Tous les élèves de vos classes."
    >
      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorCard message={error} />
      ) : myStudents.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="Aucun élève"
          description="Aucun élève ne dépend de vos classes."
        />
      ) : (
        <SearchableList<UserListItem>
          data={myStudents}
          searchKeys={['name', 'email']}
          keyExtractor={(s) => String(s.id)}
          placeholder="Rechercher un élève…"
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item: s }) => (
            <View className="flex-row items-center gap-4 squircle-xl bg-surface-container p-4 ghost-border">
              <View className="size-10 items-center justify-center rounded-full bg-primary/10">
                <Icon name="person-outline" size={20} color="#7bd0ff" />
              </View>
              <View className="flex-1">
                <Text className="font-headline text-base font-bold text-on-surface">
                  {s.name?.trim() || s.email}
                </Text>
                <Text className="text-sm text-on-surface-variant">{s.email}</Text>
              </View>
            </View>
          )}
        />
      )}
    </ScreenShell>
  );
}
