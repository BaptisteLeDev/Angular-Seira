import { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Icon, type IoniconName } from '@src/ui/Icon';
import { LoadingView } from '@src/ui/LoadingView';
import { ErrorCard } from '@src/ui/ErrorCard';
import { EmptyState } from '@src/ui/EmptyState';
import { VideoPlayer } from '@src/ui/VideoPlayer';
import { MarkdownView } from '@src/ui/MarkdownView';
import { SommaireSheet, type SommaireEntry } from '@src/ui/SommaireSheet';
import { Fab } from '@src/ui/Fab';
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
import { useScrollDirection } from '@src/utils/useScrollDirection';

const EMPTY: readonly Chapitre[] = [];

export default function ArticleScreen() {
  const router = useRouter();
  const { id, articleId } = useLocalSearchParams<{ id: string; articleId: string }>();
  const formationId = Number(id);
  const currentArticleId = Number(articleId);

  const formation = useFormationStore((s) => s.byId(formationId));
  const formationStatus = useFormationStore((s) => s.status);
  const chapitres =
    useFormationStore((s) => s.chapitresByFormation[formationId]) ?? EMPTY;
  const chapitresStatus = useFormationStore((s) => s.chapitresStatusOf(formationId));
  const loadFormations = useFormationStore((s) => s.load);
  const loadChapitres = useFormationStore((s) => s.loadChapitres);

  const articlesByChapitre = useArticleStore((s) => s.byChapitre);
  const loadByChapitre = useArticleStore((s) => s.loadByChapitre);

  const [sheetOpen, setSheetOpen] = useState(false);
  const { visible: fabVisible, onScroll } = useScrollDirection();

  useEffect(() => { void loadFormations(); }, [loadFormations]);
  useEffect(() => { if (formation) void loadChapitres(formation.id); }, [formation, loadChapitres]);
  useEffect(() => {
    for (const c of chapitres) void loadByChapitre(c.id, [...(c.contents ?? [])]);
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

  const active = entries.find((e) => e.article.id === currentArticleId) ?? null;
  const next = active ? entries.find((e) => e.index === active.index + 1) ?? null : null;
  const prev = active ? entries.find((e) => e.index === active.index - 1) ?? null : null;

  const isLoading =
    formationStatus === 'loading' ||
    chapitresStatus === 'loading' ||
    (!active && entries.length === 0);

  const goTo = (entry: SommaireEntry) => {
    setSheetOpen(false);
    router.replace({
      pathname: '/formations/[id]/[articleId]',
      params: { id: String(formationId), articleId: String(entry.article.id) },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 120, backgroundColor: colors.background }}
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
            <Icon name="arrow-back" size={16} color={colors.onSurfaceVariant} />
            <Text className="text-sm text-on-surface-variant">Retour</Text>
          </Pressable>

          {isLoading ? (
            <LoadingView label="Chargement..." />
          ) : !active ? (
            <ErrorCard message="Contenu introuvable." />
          ) : (
            <View className="squircle-2xl bg-surface-container p-6 ghost-border">
              <View className="mb-5 border-b border-outline-variant pb-5">
                <Text className="font-headline text-[11px] font-bold uppercase tracking-[3px] text-primary">
                  {active.chapitre.title}
                </Text>
                <Text className="mt-3 font-headline text-2xl font-extrabold leading-tight tracking-tight text-on-surface">
                  {active.article.title}
                </Text>
                <View className="mt-4 flex-row flex-wrap items-center gap-4">
                  <View className="flex-row items-center gap-1.5">
                    <Icon name={contentTypeIcon(active.article.type)} size={14} color={colors.onSurfaceVariant} />
                    <Text className="font-mono text-xs text-on-surface-variant">
                      {contentTypeLabel(active.article.type)}
                    </Text>
                  </View>
                  {articleDurationMin(active.article) ? (
                    <View className="flex-row items-center gap-1.5">
                      <Icon name="time-outline" size={14} color={colors.onSurfaceVariant} />
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
                      <Icon name="arrow-back" size={16} color={colors.onSurfaceVariant} />
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
                      className="flex-1 flex-row items-center justify-end gap-2 squircle-xl bg-primary/10 px-5 py-4 ghost-border"
                      accessibilityRole="button"
                      accessibilityLabel="Article suivant"
                    >
                      <Text className="font-headline text-sm font-bold text-on-surface">
                        Suivant
                      </Text>
                      <Icon name="arrow-forward" size={16} color={colors.primary} />
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
        activeArticleId={currentArticleId}
        onSelect={goTo}
      />
    </SafeAreaView>
  );
}

function ArticleBody({ article }: { article: Article }) {
  const body = article.content ?? article.description ?? null;

  return (
    <View className="gap-5">
      {article.type === 'video' ? <VideoPlayer url={article.sourceUrl} /> : null}

      {article.type === 'link' && article.sourceUrl ? (
        <LinkCard
          onPress={() => Linking.openURL(article.sourceUrl!)}
          icon="link"
          iconBg="rgba(123,208,255,0.15)"
          iconColor={colors.primary}
          title="Ouvrir le lien"
          subtitle={article.sourceUrl}
        />
      ) : null}

      {article.type === 'pdf' && article.filePath ? (
        <LinkCard
          onPress={() => {}}
          icon="document-outline"
          iconBg="rgba(248,113,113,0.1)"
          iconColor={colors.error}
          title="Document PDF"
          subtitle={article.filePath}
        />
      ) : null}

      {article.type === 'file' && article.filePath ? (
        <LinkCard
          onPress={() => {}}
          icon="attach-outline"
          iconBg="rgba(123,208,255,0.1)"
          iconColor={colors.primary}
          title="Fichier joint"
          subtitle={article.filePath}
        />
      ) : null}

      {article.type === 'markdown' ? (
        body ? (
          <MarkdownView>{body}</MarkdownView>
        ) : (
          <EmptyState
            icon="document-text-outline"
            title="Contenu en préparation"
            description="Cet article sera enrichi prochainement."
          />
        )
      ) : body ? (
        <Text className="text-base leading-relaxed text-on-surface">{body}</Text>
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
      <View className="size-12 items-center justify-center squircle-lg" style={{ backgroundColor: iconBg }}>
        <Icon name={icon} size={22} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="font-headline text-sm font-bold text-on-surface">{title}</Text>
        <Text className="mt-0.5 text-xs text-on-surface-variant" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Icon name="open-outline" size={16} color={colors.onSurfaceVariant} />
    </Pressable>
  );
}
