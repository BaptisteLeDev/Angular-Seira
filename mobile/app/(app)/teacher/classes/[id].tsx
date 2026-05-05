import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { RoleGate } from '@src/ui/RoleGate';
import { ScreenShell } from '@src/ui/ScreenShell';
import { LoadingView } from '@src/ui/LoadingView';
import { ErrorCard } from '@src/ui/ErrorCard';
import { EmptyState } from '@src/ui/EmptyState';
import { Icon } from '@src/ui/Icon';
import { ClassroomApi } from '@src/api/classroom.api';
import { UserApi } from '@src/api/user.api';
import { useAuthStore } from '@src/stores/auth.store';
import { useFormationStore } from '@src/stores/formation.store';
import { iriToId } from '@src/utils/iri';
import type { Classroom } from '@src/schemas/classroom.schema';
import type { Formation } from '@src/schemas/formation.schema';

function safeIriToId(iri?: string | null): number | null {
  if (!iri) return null;
  try {
    const n = iriToId(iri);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export default function TeacherClassroomDetailScreen() {
  return (
    <RoleGate allowed={['teacher']}>
      <Body />
    </RoleGate>
  );
}

function Body() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const classroomId = Number(id);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const userSchoolId = useAuthStore((s) => s.user?.schoolId ?? null);

  const formations = useFormationStore((s) => s.items);
  const loadFormations = useFormationStore((s) => s.load);

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadFormations();
  }, [loadFormations]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all([
      ClassroomApi.list({ schoolId: userSchoolId }),
      UserApi.list({ role: 'student', schoolId: userSchoolId }),
    ])
      .then(([classes, students]) => {
        if (!alive) return;
        const found = classes.find((c) => c.id === classroomId) ?? null;
        setClassroom(found);
        setStudentCount(students.filter((s) => s.classroomId === classroomId).length);
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
  }, [classroomId, userSchoolId]);

  const teacherFormationsForClass = useMemo<readonly Formation[]>(() => {
    return formations.filter((f) => {
      if (safeIriToId(f.teacher) !== userId) return false;
      const ids = (f.classrooms ?? [])
        .map(safeIriToId)
        .filter((n): n is number => n !== null);
      return ids.includes(classroomId);
    });
  }, [formations, userId, classroomId]);

  return (
    <ScreenShell
      back
      eyebrow="Classe"
      title={classroom?.name ?? 'Détail classe'}
      subtitle={classroom?.level ?? 'Formations et élèves de la classe.'}
    >
      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorCard message={error} />
      ) : !classroom ? (
        <ErrorCard message="Classe introuvable." />
      ) : (
        <View className="gap-6">
          <View className="flex-row gap-3">
            <View className="flex-1 squircle-xl bg-surface-container p-4 ghost-border">
              <View className="mb-2 size-9 items-center justify-center squircle-lg bg-primary/10">
                <Icon name="people-outline" size={18} color="#7bd0ff" />
              </View>
              <Text className="font-headline text-2xl font-extrabold text-on-surface">
                {studentCount ?? '—'}
              </Text>
              <Text className="text-xs text-on-surface-variant">Élève(s)</Text>
            </View>
            <View className="flex-1 squircle-xl bg-surface-container p-4 ghost-border">
              <View className="mb-2 size-9 items-center justify-center squircle-lg bg-primary/10">
                <Icon name="book-outline" size={18} color="#7bd0ff" />
              </View>
              <Text className="font-headline text-2xl font-extrabold text-on-surface">
                {teacherFormationsForClass.length}
              </Text>
              <Text className="text-xs text-on-surface-variant">Matière(s) que vous donnez</Text>
            </View>
          </View>

          <View className="gap-3">
            <Text className="font-headline text-xs font-bold uppercase tracking-[3px] text-on-surface-variant">
              Mes matières dans cette classe
            </Text>
            {teacherFormationsForClass.length === 0 ? (
              <EmptyState
                icon="book-outline"
                title="Aucune matière"
                description="Vous n'enseignez aucune matière dans cette classe."
              />
            ) : (
              teacherFormationsForClass.map((f) => (
                <View
                  key={f.id}
                  className="flex-row items-center gap-4 squircle-xl bg-surface-container p-4 ghost-border"
                >
                  <View className="size-10 items-center justify-center squircle-lg bg-primary/10">
                    <Icon name="book-outline" size={20} color="#7bd0ff" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-headline text-base font-bold text-on-surface">
                      {f.name}
                    </Text>
                    {f.description ? (
                      <Text className="text-xs text-on-surface-variant" numberOfLines={1}>
                        {f.description}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      )}
    </ScreenShell>
  );
}
