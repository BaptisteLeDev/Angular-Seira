import { useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';

import { ScreenShell } from '@src/ui/ScreenShell';
import { EmptyState } from '@src/ui/EmptyState';
import { useProgressStore } from '@src/stores/progress.store';
import { totalWatchedSeconds, formatWatchTime, videoStats } from '@src/utils/progress-summary';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[45%] flex-1 gap-1 squircle-xl bg-surface-container p-4 ghost-border">
      <Text className="text-xs text-on-surface-variant">{label}</Text>
      <Text className="font-headline text-lg font-bold text-on-surface">{value}</Text>
    </View>
  );
}

export default function ProgressScreen() {
  const byVideoId = useProgressStore((s) => s.byVideoId);
  const hydrate = useProgressStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const entries = useMemo(() => Object.values(byVideoId), [byVideoId]);
  const stats = useMemo(() => videoStats(entries), [entries]);
  const timeLabel = useMemo(() => formatWatchTime(totalWatchedSeconds(byVideoId)), [byVideoId]);

  return (
    <ScreenShell
      eyebrow="Mon suivi"
      title="Ma progression"
      subtitle="Votre avancement, mis à jour automatiquement pendant le visionnage."
    >
      {entries.length === 0 ? (
        <EmptyState
          icon="bar-chart-outline"
          title="Pas encore de progression"
          description="Commencez à visionner une vidéo pour voir votre suivi ici."
        />
      ) : (
        <View className="flex-row flex-wrap gap-3">
          <StatCard label="Temps visionné" value={timeLabel} />
          <StatCard label="Avancement moyen" value={`${stats.averagePercent} %`} />
          <StatCard label="Vidéos commencées" value={String(stats.started)} />
          <StatCard label="Vidéos terminées" value={String(stats.completed)} />
        </View>
      )}
    </ScreenShell>
  );
}
