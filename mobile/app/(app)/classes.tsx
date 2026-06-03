import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenShell } from '@src/ui/ScreenShell';
import { LoadingView } from '@src/ui/LoadingView';
import { ErrorCard } from '@src/ui/ErrorCard';
import { EmptyState } from '@src/ui/EmptyState';
import { Icon } from '@src/ui/Icon';
import { ClassroomApi } from '@src/api/classroom.api';
import { useAuthStore } from '@src/stores/auth.store';
import type { Classroom } from '@src/schemas/classroom.schema';

export default function ClassesScreen() {
  const router = useRouter();
  const classroomId = useAuthStore((s) => s.user?.classroomId ?? null);

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (classroomId == null) {
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    ClassroomApi.get(classroomId)
      .then((c) => {
        if (alive) setClassroom(c);
      })
      .catch((err: unknown) => {
        if (alive) setError(err instanceof Error ? err.message : 'Erreur de chargement.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [classroomId]);

  return (
    <ScreenShell
      eyebrow="Mon parcours"
      title="Ma classe"
      subtitle="Accédez aux matières rattachées à votre classe."
    >
      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorCard message={error} />
      ) : classroom == null ? (
        <EmptyState
          icon="people-circle-outline"
          title="Aucune classe attribuée"
          description="Vous n'êtes rattaché à aucune classe pour le moment."
        />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ouvrir les matières de ${classroom.name}`}
          onPress={() => router.push('/subjects')}
          className="flex-row items-center gap-4 squircle-xl bg-surface-container p-5 ghost-border"
        >
          <View className="size-11 items-center justify-center squircle-lg bg-primary/10">
            <Icon name="school-outline" size={22} color="#7bd0ff" />
          </View>
          <View className="flex-1">
            <Text className="font-headline text-base font-bold text-on-surface">
              {classroom.name}
            </Text>
            {classroom.level ? (
              <Text className="text-sm text-on-surface-variant">{classroom.level}</Text>
            ) : null}
            <View className="mt-2 flex-row items-center gap-1">
              <Text className="font-headline text-xs font-bold uppercase tracking-widest text-primary">
                Voir les matières
              </Text>
              <Icon name="arrow-forward" size={12} color="#7bd0ff" />
            </View>
          </View>
          <Icon name="chevron-forward" size={18} color="#a1a1aa" />
        </Pressable>
      )}
    </ScreenShell>
  );
}
