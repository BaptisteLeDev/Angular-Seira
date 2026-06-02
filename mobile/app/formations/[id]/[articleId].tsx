import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Icon } from '@src/ui/Icon';
import { LoadingView } from '@src/ui/LoadingView';
import { ErrorCard } from '@src/ui/ErrorCard';
import { ArticleBody } from '@src/features/article/ArticleBody';
import { SommaireSheet, type SommaireEntry } from '@src/ui/SommaireSheet';
import { Fab } from '@src/ui/Fab';
import { useArticleStore } from '@src/stores/article.store';
import { useFormationStore } from '@src/stores/formation.store';
import { useProgressStore } from '@src/stores/progress.store';
import { unlockedChapterIds } from '@src/utils/chapter-gating';
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
import { useScrollDirection } from '@src/utils/useScrollDirection';

const EMPTY: readonly Chapitre[] = [];

export default function ArticleScreen() {
  const router = useRouter();
  const palette = useThemeColors();
  const { id, articleId } = useLocalSearchParams<{ id: string; articleId: string }>();
  const formationId = Number(id);
  const currentArticleKey = articleId;

  const formation = useFormationStore((s) => s.byId(formationId));
  const formationStatus = useFormationStore((s) => s.status);
  const chapitres =
    useFormationStore((s) => s.chapitresByFormation[formationId]) ?? EMPTY;
  const chapitresStatus = useFormationStore((s) => s.chapitresStatusOf(formationId));
  const loadFormations = useFormationStore((s) => s.loadMine);
  const loadChapitres = useFormationStore((s) => s.loadChapitres);

  const articlesByChapitre = useArticleStore((s) => s.byChapitre);
  const loadByChapitre = useArticleStore((s) => s.loadByChapitre);

  const progressByVideo = useProgressStore((s) => s.byVideoId);
  const hydrateProgress = useProgressStore((s) => s.hydrate);
  const progressHydrated = useProgressStore((s) => s.hydrated);
  useEffect(() => { void hydrateProgress(); }, [hydrateProgress]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const { visible: fabVisible, onScroll } = useScrollDirection();

  useEffect(() => { void loadFormations(); }, [loadFormations]);
  useEffect(() => { if (formation) void loadChapitres(formation.id); }, [formation, loadChapitres]);
  useEffect(() => {
    for (const c of chapitres)
      void loadByChapitre(c.id, [...(c.contents ?? [])]);
  }, [chapitres, loadByChapitre]);

  const entries = useMemo<SommaireEntry[]>(() => {
    let i = 0;
    const r: SommaireEntry[] = [];
    for (const ch of chapitres) {
      for (const a of articlesByChapitre[ch.id] ?? []) {
        i += 1;
        r.push({ article: a, chapitre: ch, index: i });
      }
    }
    return r;
  }, [chapitres, articlesByChapitre]);

  // Chapitres déverrouillés (séquentiel : un chapitre est fini quand toutes
  // ses vidéos sont à 100% du temps certifié). Sert au gating navigation.
  const unlockedIds = useMemo(() => {
    const completed = chapitres
      .filter((ch) => {
        const vids = entries
          .filter((e) => e.chapitre.id === ch.id && e.article.videoId != null)
          .map((e) => e.article.videoId as number);
        return vids.length > 0 && vids.every((vid) => (progressByVideo[vid]?.completionPercent ?? 0) >= 100);
      })
      .map((ch) => ch.id);
    return new Set(unlockedChapterIds(chapitres.map((c) => c.id), completed));
  }, [chapitres, entries, progressByVideo]);
  const isLockedChapter = (chapterId: number) => !unlockedIds.has(chapterId);

  const accent = variantFor(formationId).color;
  const active = entries.find((e) => articleKey(e.article) === currentArticleKey) ?? null;
  const nextRaw = active ? entries.find((e) => e.index === active.index + 1) ?? null : null;
  // Le bouton « suivant » ne franchit pas un chapitre verrouillé.
  const next = nextRaw && !isLockedChapter(nextRaw.chapitre.id) ? nextRaw : null;
  const prev = active ? entries.find((e) => e.index === active.index - 1) ?? null : null;

  // Garde d'accès : si l'article ouvert est dans un chapitre verrouillé,
  // redirige vers le 1er contenu accessible (attend l'hydratation progression).
  useEffect(() => {
    if (!progressHydrated || !active || !isLockedChapter(active.chapitre.id)) return;
    const target = entries.find((e) => !isLockedChapter(e.chapitre.id));
    if (target && articleKey(target.article) !== currentArticleKey) {
      router.replace({
        pathname: '/formations/[id]/[articleId]',
        params: { id: String(formationId), articleId: articleKey(target.article) },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressHydrated, active, entries, unlockedIds, currentArticleKey, formationId]);

  const isLoading =
    formationStatus === 'loading' ||
    chapitresStatus === 'loading' ||
    (!active && entries.length === 0);

  const goTo = (entry: SommaireEntry) => {
    setSheetOpen(false);
    // replace (pas push) : naviguer prev/suivant ne doit pas empiler les écrans,
    // ainsi la flèche « Retour » du haut revient toujours à la formation.
    router.replace({
      pathname: '/formations/[id]/[articleId]',
      params: { id: String(formationId), articleId: articleKey(entry.article) },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['top']}>
      <ScrollView
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={{ paddingBottom: 120, backgroundColor: palette.background }}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <View className="px-4 py-6">
          <Pressable
            onPress={() => router.back()}
            className="mb-6 flex-row items-center gap-1.5 self-start"
            accessibilityRole="link"
            accessibilityLabel="Retour"
          >
            <Icon name="arrow-back" size={16} color={palette.onSurfaceVariant} />
            <Text className="text-sm text-on-surface-variant">Retour</Text>
          </Pressable>

          {isLoading ? (
            <LoadingView label="Chargement..." />
          ) : !active ? (
            <ErrorCard message="Contenu introuvable." />
          ) : (
            <View className="squircle-2xl bg-surface-container p-6 ghost-border">
              <View className="mb-5 border-b border-outline-variant pb-5">
                <Text
                  className="font-headline text-[11px] font-bold uppercase tracking-[3px]"
                  style={{ color: accent }}
                >
                  {active.chapitre.title}
                </Text>
                <Text className="mt-3 font-headline text-2xl font-extrabold leading-tight tracking-tight text-on-surface">
                  {active.article.title}
                </Text>
                <View className="mt-4 flex-row flex-wrap items-center gap-4">
                  <View className="flex-row items-center gap-1.5">
                    <Icon name={contentTypeIcon(active.article.type)} size={14} color={palette.onSurfaceVariant} />
                    <Text className="font-mono text-xs text-on-surface-variant">
                      {contentTypeLabel(active.article.type)}
                    </Text>
                  </View>
                  {articleDurationMin(active.article) ? (
                    <View className="flex-row items-center gap-1.5">
                      <Icon name="time-outline" size={14} color={palette.onSurfaceVariant} />
                      <Text className="font-mono text-xs text-on-surface-variant">
                        {articleDurationMin(active.article)} min
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <ArticleBody article={active.article} />

              {prev || next ? (
                <View className="mt-8 flex-row gap-3 border-t border-outline-variant pt-6">
                  {prev ? (
                    <Pressable
                      onPress={() => goTo(prev)}
                      className="flex-1 flex-row items-center justify-start gap-2 squircle-xl bg-surface-container-low px-5 py-4 ghost-border"
                      accessibilityRole="button"
                      accessibilityLabel="Article précédent"
                    >
                      <Icon name="arrow-back" size={16} color={palette.onSurfaceVariant} />
                      <Text className="font-headline text-sm font-bold text-on-surface">
                        Retour
                      </Text>
                    </Pressable>
                  ) : (
                    <View className="flex-1" />
                  )}
                  {next ? (
                    <Pressable
                      onPress={() => goTo(next)}
                      className="flex-1 flex-row items-center justify-end gap-2 squircle-xl px-5 py-4 ghost-border"
                      style={{ backgroundColor: hexToRgba(accent, 0.12) }}
                      accessibilityRole="button"
                      accessibilityLabel="Article suivant"
                    >
                      <Text className="font-headline text-sm font-bold text-on-surface">
                        Suivant
                      </Text>
                      <Icon name="arrow-forward" size={16} color={accent} />
                    </Pressable>
                  ) : (
                    <View className="flex-1" />
                  )}
                </View>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>

      <Fab
        visible={fabVisible}
        onPress={() => setSheetOpen(true)}
        icon="list"
        accessibilityLabel="Ouvrir le sommaire"
      />

      <SommaireSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        chapitres={chapitres}
        entries={entries}
        activeArticleKey={currentArticleKey}
        onSelect={goTo}
      />
    </SafeAreaView>
  );
}

