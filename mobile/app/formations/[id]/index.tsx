import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon, type IoniconName } from '@src/ui/Icon';
import { LoadingView } from '@src/ui/LoadingView';
import { ErrorCard } from '@src/ui/ErrorCard';
import { EmptyState } from '@src/ui/EmptyState';
import { useArticleStore } from '@src/stores/article.store';
import { useFormationStore } from '@src/stores/formation.store';
import { useProgressStore } from '@src/stores/progress.store';
import { aggregatePercent } from '@src/utils/video-progress';
import { unlockedChapterIds, effectiveCompleted } from '@src/utils/chapter-gating';
import type { Article } from '@src/schemas/article.schema';
import type { Chapitre } from '@src/schemas/chapitre.schema';
import { useThemeColors } from '@src/ui/useThemeColors';
import { variantFor } from '@src/ui/formation-visual';
import { hexToRgba } from '@src/utils/color';
import {
  articleDurationMin,
  articleKey,
  contentTypeIcon,
  contentTypeLabel,
} from '@src/utils/article-meta';

const EMPTY_CHAPITRES: readonly Chapitre[] = [];

type Entry = { article: Article; chapitre: Chapitre; index: number };

export default function FormationOverviewScreen() {
  const router = useRouter();
  const palette = useThemeColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const formationId = Number(id);

  const formation = useFormationStore((s) => s.byId(formationId));
  const items = useFormationStore((s) => s.items);
  const formationStatus = useFormationStore((s) => s.status);
  const formationError = useFormationStore((s) => s.error);
  const chapitres =
    useFormationStore((s) => s.chapitresByFormation[formationId]) ?? EMPTY_CHAPITRES;
  const chapitresStatus = useFormationStore((s) => s.chapitresStatusOf(formationId));
  const loadFormations = useFormationStore((s) => s.loadMine);
  const loadChapitres = useFormationStore((s) => s.loadChapitres);

  const articlesByChapitre = useArticleStore((s) => s.byChapitre);
  const loadByChapitre = useArticleStore((s) => s.loadByChapitre);

  const hydrateProgress = useProgressStore((s) => s.hydrate);
  const progressByVideo = useProgressStore((s) => s.byVideoId);

  useEffect(() => { void loadFormations(); }, [loadFormations]);
  useEffect(() => { if (formation) void loadChapitres(formation.id); }, [formation, loadChapitres]);
  useEffect(() => {
    for (const c of chapitres)
      void loadByChapitre(c.id, [...(c.contents ?? [])]);
  }, [chapitres, loadByChapitre]);
  useEffect(() => { void hydrateProgress(); }, [hydrateProgress]);

  // Pull-to-refresh : recharge de force matières, chapitres, contenus et
  // progression (les stores sont sinon en cache mémoire et n'affichent pas
  // le contenu ajouté pendant que l'app tourne).
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadFormations(true);
      if (!Number.isNaN(formationId)) {
        await loadChapitres(formationId, true);
        const chs = useFormationStore.getState().chapitresByFormation[formationId] ?? [];
        await Promise.all(
          chs.map((c) =>
            loadByChapitre(c.id, [...(c.contents ?? [])], true),
          ),
        );
      }
      await hydrateProgress(true);
    } finally {
      setRefreshing(false);
    }
  }, [loadFormations, loadChapitres, loadByChapitre, hydrateProgress, formationId]);

  const entries = useMemo<Entry[]>(() => {
    let i = 0;
    const result: Entry[] = [];
    for (const ch of chapitres) {
      for (const a of articlesByChapitre[ch.id] ?? []) {
        i += 1;
        result.push({ article: a, chapitre: ch, index: i });
      }
    }
    return result;
  }, [chapitres, articlesByChapitre]);

  const formationPercent = useMemo(() => {
    const videoIds = entries
      .map((e) => e.article.videoId)
      .filter((v): v is number => typeof v === 'number');
    const percents = videoIds.map((id) => progressByVideo[id]?.completionPercent ?? 0);
    return aggregatePercent(percents);
  }, [entries, progressByVideo]);

  // Un chapitre est « terminé » si ses contenus vidéo traçables sont tous à
  // 100%. Gating assoupli : un chapitre SANS vidéo traçable (videoId null, en
  // attendant le backend #29) ne bloque pas le suivant. Le verrou se re-durcit
  // automatiquement quand le suivi backend fournira la progression réelle.
  const completedChapterIds = useMemo(() => {
    const allIds = chapitres.map((c) => c.id);
    const reallyCompleted = chapitres
      .filter((ch) => {
        const vids = entries
          .filter((e) => e.chapitre.id === ch.id)
          .map((e) => e.article.videoId)
          .filter((v): v is number => typeof v === 'number');
        return (
          vids.length > 0 &&
          vids.every((id) => (progressByVideo[id]?.completionPercent ?? 0) >= 100)
        );
      })
      .map((ch) => ch.id);
    const withTrackable = chapitres
      .filter((ch) =>
        entries.some((e) => e.chapitre.id === ch.id && typeof e.article.videoId === 'number'),
      )
      .map((ch) => ch.id);
    return effectiveCompleted(reallyCompleted, withTrackable, allIds);
  }, [chapitres, entries, progressByVideo]);

  const unlockedIds = useMemo(
    () => new Set(unlockedChapterIds(chapitres.map((c) => c.id), completedChapterIds)),
    [chapitres, completedChapterIds],
  );

  const variant = variantFor(formationId);
  const accent = variant.color;
  const accentTint = (alpha: number) => hexToRgba(accent, alpha);

  const totalArticles = entries.length;
  const totalDurationMin = Math.round(
    entries.reduce((s, e) => s + (e.article.durationSeconds ?? 0), 0) / 60,
  );

  const isLoading =
    formationStatus === 'loading' ||
    (!formation && items.length === 0) ||
    (!!formation && chapitresStatus === 'loading');

  const errorMessage =
    formationError ?? (!formation && items.length > 0 ? 'Formation introuvable.' : null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['top']}>
      <ScrollView
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={{ paddingBottom: 48 + insets.bottom, backgroundColor: palette.background }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.primary}
          />
        }
      >
        <View className="px-4 py-6">
          <Pressable
            onPress={() => router.back()}
            className="mb-6 flex-row items-center gap-1.5 self-start"
            accessibilityRole="link"
          >
            <Icon name="arrow-back" size={16} color={palette.onSurfaceVariant} />
            <Text className="text-sm text-on-surface-variant">Retour au catalogue</Text>
          </Pressable>

          {isLoading ? (
            <LoadingView label="Chargement de la formation..." />
          ) : errorMessage ? (
            <ErrorCard message={errorMessage} />
          ) : !formation ? (
            <View className="items-center squircle-xl bg-surface-container p-10 ghost-border">
              <Icon name="warning-outline" size={48} color={palette.error} />
              <Text className="mt-4 font-headline text-2xl font-bold text-on-surface text-center">
                Formation introuvable
              </Text>
              <Text className="mt-2 text-on-surface-variant text-center">
                La formation #{id} n&apos;existe pas dans le catalogue.
              </Text>
              <Link href="/subjects" asChild>
                <Pressable className="mt-6 flex-row items-center gap-2 squircle-lg bg-primary px-4 py-2">
                  <Text className="font-headline text-sm font-bold text-on-primary">
                    Retour au catalogue
                  </Text>
                </Pressable>
              </Link>
            </View>
          ) : (
            <>
              <View className="relative mb-6 overflow-hidden squircle-2xl bg-surface-container p-6 ghost-border">
                <LinearGradient
                  colors={[accentTint(0.15), accentTint(0.05), 'transparent']}
                  start={{ x: 1, y: 0 }}
                  end={{ x: 0, y: 0 }}
                  style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: '30%' }}
                />
                <View className="flex-row items-center gap-2">
                  <Icon name={variant.icon} size={14} color={accent} />
                  <Text
                    className="font-headline text-[11px] font-bold uppercase tracking-[3px]"
                    style={{ color: accent }}
                  >
                    {variant.label}
                  </Text>
                </View>
                <Text className="mt-3 font-headline text-3xl font-extrabold leading-tight tracking-tight text-on-surface">
                  {formation.name}
                </Text>
                <Text className="mt-4 text-base leading-relaxed text-on-surface-variant">
                  {formation.description ||
                    'Parcourez les chapitres pour démarrer votre apprentissage.'}
                </Text>

                <View className="mt-6 flex-row flex-wrap gap-3">
                  <StatCard accent={accent} icon="trending-up-outline" label="Progression" value={`${formationPercent}%`} />
                  <StatCard accent={accent} icon="list-outline" label="Chapitres" value={String(chapitres.length)} />
                  <StatCard accent={accent} icon="document-text-outline" label="Contenus" value={String(totalArticles)} />
                  {totalDurationMin > 0 ? (
                    <StatCard accent={accent} icon="time-outline" label="Durée totale" value={`${totalDurationMin} min`} />
                  ) : null}
                  {formation.expectedHours ? (
                    <StatCard accent={accent} icon="calendar-outline" label="Volume prévu" value={`${formation.expectedHours}h`} />
                  ) : null}
                </View>
              </View>

              {totalArticles === 0 ? (
                <EmptyState
                  icon="sparkles-outline"
                  title="Programme bientôt disponible"
                  description="Les chapitres et contenus de cette formation seront publiés prochainement."
                />
              ) : (
                <View className="mb-6 squircle-xl bg-surface-container p-5 ghost-border">
                  <View className="mb-4 flex-row items-center gap-2">
                    <Icon name="list" size={14} color={palette.onSurfaceVariant} />
                    <Text className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      Programme
                    </Text>
                  </View>
                  <View className="gap-4">
                    {chapitres.map((chapitre) => {
                      const chapitreEntries = entries.filter((e) => e.chapitre.id === chapitre.id);
                      const chapterVideoIds = chapitreEntries
                        .map((e) => e.article.videoId)
                        .filter((v): v is number => typeof v === 'number');
                      const chapterPercent = aggregatePercent(
                        chapterVideoIds.map((id) => progressByVideo[id]?.completionPercent ?? 0),
                      );
                      const locked = !unlockedIds.has(chapitre.id);
                      return (
                        <View key={chapitre.id} style={{ opacity: locked ? 0.5 : 1 }}>
                          <View className="mb-2 flex-row items-center gap-2">
                            <Text
                              className="font-headline text-xs font-bold uppercase tracking-widest"
                              style={{ color: accent }}
                            >
                              {chapitre.sortOrder}.
                            </Text>
                            <Text className="flex-1 font-headline text-xs font-bold uppercase tracking-widest text-on-surface">
                              {chapitre.title}
                            </Text>
                            {locked ? (
                              <Icon name="lock-closed" size={13} color={palette.onSurfaceVariant} />
                            ) : chapterVideoIds.length > 0 ? (
                              <Text className="font-mono text-[10px] text-primary">
                                {chapterPercent}%
                              </Text>
                            ) : null}
                          </View>
                          {locked ? (
                            <Text className="pl-4 text-xs italic text-on-surface-variant">
                              Terminez le chapitre précédent pour débloquer ce contenu.
                            </Text>
                          ) : chapitreEntries.length === 0 ? (
                            <Text className="pl-4 text-xs italic text-on-surface-variant">
                              Contenus à venir.
                            </Text>
                          ) : (
                            <View className="gap-1">
                              {chapitreEntries.map((entry) => (
                                <ProgrammeItem
                                  key={articleKey(entry.article)}
                                  entry={entry}
                                  onPress={() =>
                                    router.push({
                                      pathname: '/formations/[id]/[articleId]',
                                      params: { id: String(formationId), articleId: articleKey(entry.article) },
                                    })
                                  }
                                />
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: IoniconName;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <View className="flex-row items-center gap-3 squircle-xl bg-surface-container-high px-4 py-3 ghost-border">
      <View
        className="size-9 items-center justify-center squircle-lg"
        style={{ backgroundColor: hexToRgba(accent, 0.12) }}
      >
        <Icon name={icon} size={16} color={accent} />
      </View>
      <View>
        <Text className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant">
          {label}
        </Text>
        <Text className="font-headline text-lg font-bold text-on-surface">{value}</Text>
      </View>
    </View>
  );
}


function ProgrammeItem({ entry, onPress }: { entry: Entry; onPress: () => void }) {
  const palette = useThemeColors();
  const mins = articleDurationMin(entry.article);
  const progress = useProgressStore((s) =>
    entry.article.videoId != null ? s.byVideoId[entry.article.videoId] : null,
  );
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      className="flex-row items-start gap-3 squircle-lg px-3 py-2"
    >
      <View className="size-6 items-center justify-center squircle-md bg-surface-container-highest">
        <Icon name={contentTypeIcon(entry.article.type)} size={12} color={palette.onSurfaceVariant} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-medium text-on-surface" numberOfLines={2}>
          {entry.article.title}
        </Text>
        <View className="mt-0.5 flex-row items-center gap-2">
          <Text className="font-mono text-[10px] text-on-surface-variant">
            {contentTypeLabel(entry.article.type)}
          </Text>
          {mins ? (
            <View className="flex-row items-center gap-0.5">
              <Icon name="time-outline" size={10} color={palette.onSurfaceVariant} />
              <Text className="font-mono text-[10px] text-on-surface-variant">{mins} min</Text>
            </View>
          ) : null}
          {progress ? (
            <Text className="font-mono text-[10px] text-primary">
              {progress.status === 'completed' ? '✓ Terminé' : `${Math.round(progress.completionPercent)}%`}
            </Text>
          ) : null}
        </View>
      </View>
      <Icon name="chevron-forward" size={16} color={palette.onSurfaceVariant} />
    </Pressable>
  );
}
