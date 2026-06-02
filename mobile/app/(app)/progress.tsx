import { useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';

import { ScreenShell } from '@src/ui/ScreenShell';
import { EmptyState } from '@src/ui/EmptyState';
import { useProgressStore } from '@src/stores/progress.store';
import { useFormationStore } from '@src/stores/formation.store';
import { useArticleStore } from '@src/stores/article.store';
import {
  totalWatchedSeconds,
  formatWatchTime,
  videoStats,
  summarizeSubjectProgress,
  type SubjectProgress,
} from '@src/utils/progress-summary';

const STATUS_LABEL: Record<SubjectProgress['status'], string> = {
  not_started: 'Non commencé',
  in_progress: 'En cours',
  completed: 'Terminé',
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[45%] flex-1 gap-1 squircle-xl bg-surface-container p-4 ghost-border">
      <Text className="text-xs text-on-surface-variant">{label}</Text>
      <Text className="font-headline text-lg font-bold text-on-surface">{value}</Text>
    </View>
  );
}

function SubjectRow({ subject }: { subject: SubjectProgress }) {
  return (
    <View className="gap-2 squircle-xl bg-surface-container p-4 ghost-border">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 font-headline text-base font-bold text-on-surface" numberOfLines={1}>
          {subject.name}
        </Text>
        <Text className="text-xs text-on-surface-variant">{STATUS_LABEL[subject.status]}</Text>
      </View>
      <View
        className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest"
        accessibilityRole="progressbar"
        accessibilityValue={{ now: subject.completionPercent, min: 0, max: 100 }}
      >
        <View
          className="h-full rounded-full bg-primary"
          style={{ width: `${subject.completionPercent}%` }}
        />
      </View>
      <Text className="text-xs text-on-surface-variant">
        {subject.completionPercent} % · {subject.videosCompleted}/{subject.videosTotal} vidéos
      </Text>
    </View>
  );
}

export default function ProgressScreen() {
  const byVideoId = useProgressStore((s) => s.byVideoId);
  const hydrate = useProgressStore((s) => s.hydrate);

  const available = useFormationStore((s) => s.available);
  const loadMine = useFormationStore((s) => s.loadMine);
  const chapitresByFormation = useFormationStore((s) => s.chapitresByFormation);
  const loadChapitres = useFormationStore((s) => s.loadChapitres);

  const articlesByChapitre = useArticleStore((s) => s.byChapitre);
  const loadByChapitre = useArticleStore((s) => s.loadByChapitre);

  useEffect(() => {
    void hydrate();
    void loadMine();
  }, [hydrate, loadMine]);

  useEffect(() => {
    for (const f of available) void loadChapitres(f.id);
  }, [available, loadChapitres]);

  useEffect(() => {
    for (const f of available) {
      for (const ch of chapitresByFormation[f.id] ?? []) {
        void loadByChapitre(ch.id, [...(ch.contents ?? [])]);
      }
    }
  }, [available, chapitresByFormation, loadByChapitre]);

  const entries = useMemo(() => Object.values(byVideoId), [byVideoId]);
  const stats = useMemo(() => videoStats(entries), [entries]);
  const timeLabel = useMemo(() => formatWatchTime(totalWatchedSeconds(byVideoId)), [byVideoId]);

  const subjects = useMemo(() => {
    const map: Record<number, number[]> = {};
    for (const f of available) {
      const percents: number[] = [];
      for (const ch of chapitresByFormation[f.id] ?? []) {
        for (const a of articlesByChapitre[ch.id] ?? []) {
          if (a.videoId != null) percents.push(byVideoId[a.videoId]?.completionPercent ?? 0);
        }
      }
      map[f.id] = percents;
    }
    return summarizeSubjectProgress(
      available.map((f) => ({ id: f.id, name: f.name })),
      map,
    );
  }, [available, chapitresByFormation, articlesByChapitre, byVideoId]);

  return (
    <ScreenShell
      eyebrow="Mon suivi"
      title="Ma progression"
      subtitle="Votre avancement, mis à jour automatiquement pendant le visionnage."
    >
      <View className="gap-6">
        <View className="flex-row flex-wrap gap-3">
          <StatCard label="Temps visionné" value={timeLabel} />
          <StatCard label="Avancement moyen" value={`${stats.averagePercent} %`} />
          <StatCard label="Vidéos commencées" value={String(stats.started)} />
          <StatCard label="Vidéos terminées" value={String(stats.completed)} />
        </View>

        <View className="gap-3">
          <Text className="font-headline text-xs font-bold uppercase tracking-[3px] text-on-surface-variant">
            Avancement par matière
          </Text>
          {subjects.length === 0 ? (
            <EmptyState
              icon="bar-chart-outline"
              title="Aucune matière"
              description="Vos matières apparaîtront ici avec leur avancement."
            />
          ) : (
            subjects.map((s) => <SubjectRow key={s.subjectId} subject={s} />)
          )}
        </View>
      </View>
    </ScreenShell>
  );
}
