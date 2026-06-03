import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { RoleGate } from '@src/ui/RoleGate';
import { ScreenShell } from '@src/ui/ScreenShell';
import { LoadingView } from '@src/ui/LoadingView';
import { ErrorCard } from '@src/ui/ErrorCard';
import { EmptyState } from '@src/ui/EmptyState';
import { AggregateApi } from '@src/api/aggregate.api';
import type { TeacherStudent, TeacherSubjectAggregate } from '@src/schemas/aggregate.schema';

function studentName(s: TeacherStudent): string {
  return [s.firstName, s.lastName].filter(Boolean).join(' ') || s.email;
}

function StudentRow({ student }: { student: TeacherStudent }) {
  return (
    <View className="gap-1.5 squircle-lg bg-surface-container-high p-3">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 text-sm font-medium text-on-surface" numberOfLines={1}>
          {studentName(student)}
        </Text>
        <Text className="text-xs text-on-surface-variant">
          {student.progress.completedVideos}/{student.progress.totalVideos} · {student.progress.completionPercent} %
        </Text>
      </View>
      <View
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest"
        accessibilityRole="progressbar"
        accessibilityValue={{ now: student.progress.completionPercent, min: 0, max: 100 }}
      >
        <View
          className="h-full rounded-full bg-primary"
          style={{ width: `${student.progress.completionPercent}%` }}
        />
      </View>
    </View>
  );
}

export default function TeacherSuiviScreen() {
  return (
    <RoleGate allowed={['teacher']}>
      <Body />
    </RoleGate>
  );
}

function Body() {
  const [subjects, setSubjects] = useState<TeacherSubjectAggregate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    AggregateApi.teacher()
      .then((d) => alive && setSubjects(d))
      .catch((err: unknown) => alive && setError(err instanceof Error ? err.message : 'Erreur'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <ScreenShell back eyebrow="Professeur" title="Suivi des élèves" subtitle="Progression par matière et par classe.">
      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorCard message={error} />
      ) : subjects.length === 0 ? (
        <EmptyState icon="bar-chart-outline" title="Aucune matière" description="Aucune matière à suivre." />
      ) : (
        <View className="gap-6">
          {subjects.map((subject) => (
            <View key={subject.id} className="gap-3">
              <Text className="font-headline text-lg font-bold text-on-surface">{subject.name}</Text>
              {subject.classrooms.map((classroom) => (
                <View key={classroom.id} className="gap-2">
                  <Text className="text-xs font-bold uppercase tracking-[2px] text-on-surface-variant">
                    {classroom.name}
                    {classroom.level ? ` · ${classroom.level}` : ''}
                  </Text>
                  {classroom.students.length === 0 ? (
                    <Text className="text-xs text-on-surface-variant">Aucun élève.</Text>
                  ) : (
                    classroom.students.map((student) => <StudentRow key={student.id} student={student} />)
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
    </ScreenShell>
  );
}
