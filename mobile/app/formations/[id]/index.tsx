import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon, type IoniconName } from '@src/ui/Icon';
import { LoadingView } from '@src/ui/LoadingView';
import { ErrorCard } from '@src/ui/ErrorCard';
import { EmptyState } from '@src/ui/EmptyState';
import { useArticleStore } from '@src/stores/article.store';
import { useFormationStore } from '@src/stores/formation.store';
import type { Article } from '@src/schemas/article.schema';
import type { Chapitre } from '@src/schemas/chapitre.schema';
import { colors } from '@src/constants/theme';
import {
  articleDurationMin,
  contentTypeIcon,
  contentTypeLabel,
} from '@src/utils/article-meta';

const EMPTY_CHAPITRES: readonly Chapitre[] = [];

type Entry = { article: Article; chapitre: Chapitre; index: number };

export default function FormationOverviewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const formationId = Number(id);

  const formation = useFormationStore((s) => s.byId(formationId));
  const items = useFormationStore((s) => s.items);
  const formationStatus = useFormationStore((s) => s.status);
  const formationError = useFormationStore((s) => s.error);
  const chapitres =
    useFormationStore((s) => s.chapitresByFormation[formationId]) ?? EMPTY_CHAPITRES;
  const chapitresStatus = useFormationStore((s) => s.chapitresStatusOf(formationId));
  const loadFormations = useFormationStore((s) => s.load);
  const loadChapitres = useFormationStore((s) => s.loadChapitres);

  const articlesByChapitre = useArticleStore((s) => s.byChapitre);
  const loadByChapitre = useArticleStore((s) => s.loadByChapitre);

  useEffect(() => { void loadFormations(); }, [loadFormations]);
  useEffect(() => { if (formation) void loadChapitres(formation.id); }, [formation, loadChapitres]);
  useEffect(() => {
    for (const c of chapitres) void loadByChapitre(c.id, [...(c.contents ?? [])]);
  }, [chapitres, loadByChapitre]);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 48, backgroundColor: colors.background }}
      >
        <View className="px-4 py-6">
          <Pressable
            onPress={() => router.back()}
            className="mb-6 flex-row items-center gap-1.5 self-start"
            accessibilityRole="link"
          >
            <Icon name="arrow-back" size={16} color={colors.onSurfaceVariant} />
            <Text className="text-sm text-on-surface-variant">Retour au catalogue</Text>
          </Pressable>

          {isLoading ? (
            <LoadingView label="Chargement de la formation..." />
          ) : errorMessage ? (
            <ErrorCard message={errorMessage} />
          ) : !formation ? (
            <View className="items-center squircle-xl bg-surface-container p-10 ghost-border">
              <Icon name="warning-outline" size={48} color={colors.error} />
              <Text className="mt-4 font-headline text-2xl font-bold text-on-surface text-center">
                Formation introuvable
              </Text>
              <Text className="mt-2 text-on-surface-variant text-center">
                La formation #{id} n'existe pas dans le catalogue.
              </Text>
              <Link href="/formations" asChild>
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
                  colors={['rgba(123,208,255,0.15)', 'rgba(123,208,255,0.05)', 'transparent']}
                  start={{ x: 1, y: 0 }}
                  end={{ x: 0, y: 0 }}
                  style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: '30%' }}
                />
                <View className="flex-row items-center gap-2">
                  <Icon name="school-outline" size={14} color={colors.primary} />
                  <Text className="font-headline text-[11px] font-bold uppercase tracking-[3px] text-primary">
                    Formation
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
                  <StatCard icon="list-outline" label="Chapitres" value={String(chapitres.length)} />
                  <StatCard icon="document-text-outline" label="Contenus" value={String(totalArticles)} />
                  {totalDurationMin > 0 ? (
                    <StatCard icon="time-outline" label="Durée totale" value={`${totalDurationMin} min`} />
                  ) : null}
                  {formation.expectedHours ? (
                    <StatCard icon="calendar-outline" label="Volume prévu" value={`${formation.expectedHours}h`} />
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
                    <Icon name="list" size={14} color={colors.onSurfaceVariant} />
                    <Text className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      Programme
                    </Text>
                  </View>
                  <View className="gap-4">
                    {chapitres.map((chapitre) => {
                      const chapitreEntries = entries.filter((e) => e.chapitre.id === chapitre.id);
                      return (
                        <View key={chapitre.id}>
                          <View className="mb-2 flex-row items-center gap-2">
                            <Text className="font-headline text-xs font-bold uppercase tracking-widest text-primary">
                              {chapitre.sortOrder}.
                            </Text>
                            <Text className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface">
                              {chapitre.title}
                            </Text>
                          </View>
                          {chapitreEntries.length === 0 ? (
                            <Text className="pl-4 text-xs italic text-on-surface-variant">
                              Contenus à venir.
                            </Text>
                          ) : (
                            <View className="gap-1">
                              {chapitreEntries.map((entry) => (
                                <ProgrammeItem
                                  key={entry.article.id}
                                  entry={entry}
                                  onPress={() =>
                                    router.push({
                                      pathname: '/formations/[id]/[articleId]',
                                      params: { id: String(formationId), articleId: String(entry.article.id) },
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

function StatCard({ icon, label, value }: { icon: IoniconName; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-3 squircle-xl bg-surface-container-high px-4 py-3 ghost-border">
      <View className="size-9 items-center justify-center squircle-lg bg-primary/10">
        <Icon name={icon} size={16} color={colors.primary} />
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
  const mins = articleDurationMin(entry.article);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      className="flex-row items-start gap-3 squircle-lg px-3 py-2"
    >
      <View className="size-6 items-center justify-center squircle-md bg-surface-container-highest">
        <Icon name={contentTypeIcon(entry.article.type)} size={12} color={colors.onSurfaceVariant} />
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
              <Icon name="time-outline" size={10} color={colors.onSurfaceVariant} />
              <Text className="font-mono text-[10px] text-on-surface-variant">{mins} min</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Icon name="chevron-forward" size={16} color={colors.onSurfaceVariant} />
    </Pressable>
  );
}
