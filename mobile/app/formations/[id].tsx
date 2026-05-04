import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon, type IoniconName } from '@src/ui/Icon';
import { LoadingView } from '@src/ui/LoadingView';
import { ErrorCard } from '@src/ui/ErrorCard';
import { EmptyState } from '@src/ui/EmptyState';
import { VideoPlayer } from '@src/ui/VideoPlayer';
import { useArticleStore } from '@src/stores/article.store';
import { useFormationStore } from '@src/stores/formation.store';
import type { Article, ContentType } from '@src/schemas/article.schema';
import type { Chapitre } from '@src/schemas/chapitre.schema';

const EMPTY_CHAPITRES: readonly Chapitre[] = [];

type ArticleEntry = {
  article: Article;
  chapitre: Chapitre;
  index: number;
};

export default function CourseDetailScreen() {
  const router = useRouter();
  const { id: formationIdParam, article: articleIdParam } = useLocalSearchParams<{
    id: string;
    article?: string;
  }>();
  const formationId = Number(formationIdParam);

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

  const [activeArticleId, setActiveArticleId] = useState<number | null>(
    articleIdParam ? Number(articleIdParam) : null,
  );

  useEffect(() => {
    void loadFormations();
  }, [loadFormations]);

  useEffect(() => {
    if (formation) void loadChapitres(formation.id);
  }, [formation, loadChapitres]);

  useEffect(() => {
    for (const chapitre of chapitres) {
      void loadByChapitre(chapitre.id, [...(chapitre.contents ?? [])]);
    }
  }, [chapitres, loadByChapitre]);

  const entries = useMemo<ArticleEntry[]>(() => {
    let index = 0;
    const result: ArticleEntry[] = [];
    for (const chapitre of chapitres) {
      const articles = articlesByChapitre[chapitre.id] ?? [];
      for (const article of articles) {
        index += 1;
        result.push({ article, chapitre, index });
      }
    }
    return result;
  }, [chapitres, articlesByChapitre]);

  // Auto-sélection du premier contenu
  useEffect(() => {
    if (activeArticleId === null && entries.length > 0) {
      setActiveArticleId(entries[0].article.id);
    }
  }, [activeArticleId, entries]);

  const active = entries.find((e) => e.article.id === activeArticleId) ?? null;
  const totalArticles = entries.length;
  const totalDurationMin = Math.round(
    entries.reduce((sum, e) => sum + (e.article.durationSeconds ?? 0), 0) / 60,
  );
  const progressPercent = totalArticles === 0 || !active
    ? 0
    : Math.round((active.index / totalArticles) * 100);

  const isLoading =
    formationStatus === 'loading' ||
    (!formation && items.length === 0) ||
    (!!formation && chapitresStatus === 'loading');

  const errorMessage = (() => {
    if (formationError) return formationError;
    if (!formation && items.length > 0) return 'Formation introuvable.';
    return null;
  })();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0b0b0c' }} edges={['top']}>
      <ScrollView
        style={{ backgroundColor: '#0b0b0c' }}
        contentContainerStyle={{ paddingBottom: 48, backgroundColor: '#0b0b0c' }}
      >
        <View className="px-4 py-6">
          {/* Breadcrumb */}
          <Pressable
            onPress={() => router.back()}
            className="mb-6 flex-row items-center gap-1.5 self-start"
            accessibilityRole="link"
          >
            <Icon name="arrow-back" size={16} color="#a1a1aa" />
            <Text className="text-sm text-on-surface-variant">Retour au catalogue</Text>
          </Pressable>

          {isLoading ? (
            <LoadingView label="Chargement de la formation..." />
          ) : errorMessage ? (
            <ErrorCard message={errorMessage} />
          ) : !formation ? (
            <View className="items-center squircle-xl bg-surface-container p-10 ghost-border">
              <Icon name="warning-outline" size={48} color="#f87171" />
              <Text className="mt-4 font-headline text-2xl font-bold text-on-surface text-center">
                Formation introuvable
              </Text>
              <Text className="mt-2 text-on-surface-variant text-center">
                La formation #{formationIdParam} n'existe pas dans le catalogue.
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
              {/* Hero */}
              <View className="relative mb-6 overflow-hidden squircle-2xl bg-surface-container p-6 ghost-border">
                <LinearGradient
                  colors={['rgba(123,208,255,0.15)', 'rgba(123,208,255,0.05)', 'transparent']}
                  start={{ x: 1, y: 0 }}
                  end={{ x: 0, y: 0 }}
                  style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: '30%' }}
                />
                <View className="flex-row items-center gap-2">
                  <Icon name="school-outline" size={14} color="#7bd0ff" />
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

                {/* Stats */}
                <View className="mt-6 flex-row flex-wrap gap-3">
                  <StatCard icon="list-outline" label="Chapitres" value={String(chapitres.length)} />
                  <StatCard
                    icon="document-text-outline"
                    label="Contenus"
                    value={String(totalArticles)}
                  />
                  {totalDurationMin > 0 ? (
                    <StatCard
                      icon="time-outline"
                      label="Durée totale"
                      value={`${totalDurationMin} min`}
                    />
                  ) : null}
                  {formation.expectedHours ? (
                    <StatCard
                      icon="calendar-outline"
                      label="Volume prévu"
                      value={`${formation.expectedHours}h`}
                    />
                  ) : null}
                </View>

                {/* Progress */}
                {totalArticles > 0 ? (
                  <View className="mt-6">
                    <View className="mb-2 flex-row items-center justify-between">
                      <Text className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">
                        Progression
                      </Text>
                      <Text className="font-mono text-[11px] uppercase tracking-widest text-on-surface">
                        {progressPercent}%
                      </Text>
                    </View>
                    <View
                      className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest"
                      accessibilityRole="progressbar"
                      accessibilityValue={{ now: progressPercent, min: 0, max: 100 }}
                    >
                      <View
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </View>
                  </View>
                ) : null}
              </View>

              {totalArticles === 0 ? (
                <EmptyState
                  icon="sparkles-outline"
                  title="Programme bientôt disponible"
                  description="Les chapitres et contenus de cette formation seront publiés prochainement."
                />
              ) : (
                <>
                  {/* Programme */}
                  <View className="mb-6 squircle-xl bg-surface-container p-5 ghost-border">
                    <View className="mb-4 flex-row items-center gap-2">
                      <Icon name="list" size={14} color="#a1a1aa" />
                      <Text className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                        Programme
                      </Text>
                    </View>

                    <View className="gap-4">
                      {chapitres.map((chapitre) => {
                        const chapitreEntries = entries.filter(
                          (e) => e.chapitre.id === chapitre.id,
                        );
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
                                    active={entry.article.id === activeArticleId}
                                    onPress={() => setActiveArticleId(entry.article.id)}
                                  />
                                ))}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  {/* Contenu actif */}
                  {active ? (
                    <View className="squircle-2xl bg-surface-container p-6 ghost-border">
                      <View className="mb-5 border-b border-outline-variant pb-5">
                        <View className="mb-3 flex-row items-center gap-2">
                          <View className="size-5 items-center justify-center squircle-sm bg-primary/15">
                            <Text className="font-mono text-[10px] font-bold text-primary">
                              {active.chapitre.sortOrder}
                            </Text>
                          </View>
                          <Text className="font-headline text-[11px] font-bold uppercase tracking-[3px] text-primary">
                            {active.chapitre.title}
                          </Text>
                        </View>
                        <Text className="font-headline text-2xl font-extrabold leading-tight tracking-tight text-on-surface">
                          {active.article.title}
                        </Text>
                        <View className="mt-4 flex-row flex-wrap items-center gap-4">
                          <View className="flex-row items-center gap-1.5">
                            <Icon
                              name={contentTypeIcon(active.article.type)}
                              size={14}
                              color="#a1a1aa"
                            />
                            <Text className="font-mono text-xs text-on-surface-variant">
                              {contentTypeLabel(active.article.type)}
                            </Text>
                          </View>
                          <View className="flex-row items-center gap-1.5">
                            <Icon name="pricetag-outline" size={14} color="#a1a1aa" />
                            <Text className="font-mono text-xs text-on-surface-variant">
                              Contenu {active.index} / {totalArticles}
                            </Text>
                          </View>
                          {articleDurationMin(active.article) ? (
                            <View className="flex-row items-center gap-1.5">
                              <Icon name="time-outline" size={14} color="#a1a1aa" />
                              <Text className="font-mono text-xs text-on-surface-variant">
                                {articleDurationMin(active.article)} min
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>

                      {/* Content body */}
                      <ArticleBody article={active.article} />

                      {/* Prev / next */}
                      <View className="mt-8 gap-3 border-t border-outline-variant pt-6">
                        {(() => {
                          const prev = entries.find((e) => e.index === active.index - 1) ?? null;
                          const next = entries.find((e) => e.index === active.index + 1) ?? null;
                          return (
                            <>
                              {prev ? (
                                <Pressable
                                  onPress={() => setActiveArticleId(prev.article.id)}
                                  className="squircle-xl bg-surface-container-low p-4 ghost-border"
                                >
                                  <View className="flex-row items-center gap-1">
                                    <Icon name="arrow-back" size={12} color="#a1a1aa" />
                                    <Text className="font-headline text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                                      Précédent
                                    </Text>
                                  </View>
                                  <Text
                                    className="mt-1 font-headline text-sm font-bold text-on-surface"
                                    numberOfLines={1}
                                  >
                                    {prev.article.title}
                                  </Text>
                                </Pressable>
                              ) : null}
                              {next ? (
                                <Pressable
                                  onPress={() => setActiveArticleId(next.article.id)}
                                  className="squircle-xl bg-primary/10 p-4 ghost-border items-end"
                                >
                                  <View className="flex-row items-center gap-1">
                                    <Text className="font-headline text-[10px] font-bold uppercase tracking-widest text-primary">
                                      Suivant
                                    </Text>
                                    <Icon name="arrow-forward" size={12} color="#7bd0ff" />
                                  </View>
                                  <Text
                                    className="mt-1 font-headline text-sm font-bold text-on-surface text-right"
                                    numberOfLines={1}
                                  >
                                    {next.article.title}
                                  </Text>
                                </Pressable>
                              ) : null}
                            </>
                          );
                        })()}
                      </View>
                    </View>
                  ) : (
                    <EmptyState
                      icon="book-outline"
                      title="Prêt à commencer ?"
                      description="Sélectionnez un contenu dans le programme pour démarrer."
                      iconColor="#7bd0ff"
                    />
                  )}
                </>
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
}: {
  icon: IoniconName;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-3 squircle-xl bg-surface-container-high px-4 py-3 ghost-border">
      <View className="size-9 items-center justify-center squircle-lg bg-primary/10">
        <Icon name={icon} size={16} color="#7bd0ff" />
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

function ProgrammeItem({
  entry,
  active,
  onPress,
}: {
  entry: ArticleEntry;
  active: boolean;
  onPress: () => void;
}) {
  const mins = articleDurationMin(entry.article);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityState={{ selected: active }}
      className={`flex-row items-start gap-3 squircle-lg px-3 py-2 ${
        active ? 'bg-surface-container-high' : ''
      }`}
      style={{
        borderLeftWidth: 2,
        borderLeftColor: active ? '#7bd0ff' : 'transparent',
      }}
    >
      <View
        className={`size-6 items-center justify-center squircle-md ${
          active ? 'bg-primary' : 'bg-surface-container-highest'
        }`}
      >
        <Icon
          name={contentTypeIcon(entry.article.type)}
          size={12}
          color={active ? '#041c27' : '#a1a1aa'}
        />
      </View>
      <View className="flex-1">
        <Text
          className={`text-sm text-on-surface ${active ? 'font-bold' : 'font-medium'}`}
          numberOfLines={2}
        >
          {entry.article.title}
        </Text>
        <View className="mt-0.5 flex-row items-center gap-2">
          <Text className="font-mono text-[10px] text-on-surface-variant">
            {contentTypeLabel(entry.article.type)}
          </Text>
          {mins ? (
            <View className="flex-row items-center gap-0.5">
              <Icon name="time-outline" size={10} color="#a1a1aa" />
              <Text className="font-mono text-[10px] text-on-surface-variant">{mins} min</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function ArticleBody({ article }: { article: Article }) {
  const body = article.content ?? article.description ?? null;

  return (
    <View className="gap-5">
      {article.type === 'video' ? (
        <VideoPlayer url={article.sourceUrl} />
      ) : null}

      {article.type === 'link' && article.sourceUrl ? (
        <LinkCard
          onPress={() => Linking.openURL(article.sourceUrl!)}
          icon="link"
          iconBg="rgba(123,208,255,0.15)"
          iconColor="#7bd0ff"
          title="Ouvrir le lien"
          subtitle={article.sourceUrl}
        />
      ) : null}

      {article.type === 'pdf' && article.filePath ? (
        <LinkCard
          onPress={() => {}}
          icon="document-outline"
          iconBg="rgba(248,113,113,0.1)"
          iconColor="#f87171"
          title="Document PDF"
          subtitle={article.filePath}
        />
      ) : null}

      {article.type === 'file' && article.filePath ? (
        <LinkCard
          onPress={() => {}}
          icon="attach-outline"
          iconBg="rgba(123,208,255,0.1)"
          iconColor="#7bd0ff"
          title="Fichier joint"
          subtitle={article.filePath}
        />
      ) : null}

      {body ? (
        <Text className="text-base leading-relaxed text-on-surface">{body}</Text>
      ) : article.type === 'markdown' ? (
        <EmptyState
          icon="document-text-outline"
          title="Contenu en préparation"
          description="Cet article sera enrichi prochainement."
        />
      ) : null}
    </View>
  );
}

function LinkCard({
  onPress,
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
}: {
  onPress: () => void;
  icon: IoniconName;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 squircle-xl bg-surface-container-low p-4 ghost-border"
    >
      <View
        className="size-12 items-center justify-center squircle-lg"
        style={{ backgroundColor: iconBg }}
      >
        <Icon name={icon} size={22} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="font-headline text-sm font-bold text-on-surface">{title}</Text>
        <Text className="mt-0.5 text-xs text-on-surface-variant" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Icon name="open-outline" size={16} color="#a1a1aa" />
    </Pressable>
  );
}

function articleDurationMin(article: Article): number | null {
  if (typeof article.durationSeconds !== 'number') return null;
  return Math.max(1, Math.round(article.durationSeconds / 60));
}

function contentTypeIcon(type: ContentType | string): IoniconName {
  switch (type) {
    case 'video':
      return 'play-circle-outline';
    case 'pdf':
      return 'document-outline';
    case 'markdown':
      return 'document-text-outline';
    case 'link':
      return 'link-outline';
    case 'file':
      return 'attach-outline';
    default:
      return 'document-outline';
  }
}

function contentTypeLabel(type: ContentType | string): string {
  switch (type) {
    case 'video':
      return 'Vidéo';
    case 'pdf':
      return 'PDF';
    case 'markdown':
      return 'Article';
    case 'link':
      return 'Lien';
    case 'file':
      return 'Fichier';
    default:
      return 'Contenu';
  }
}
