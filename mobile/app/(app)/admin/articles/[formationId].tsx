import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { RoleGate } from '@src/ui/RoleGate';
import { ScreenShell } from '@src/ui/ScreenShell';
import { LoadingView } from '@src/ui/LoadingView';
import { ErrorCard } from '@src/ui/ErrorCard';
import { EmptyState } from '@src/ui/EmptyState';
import { Icon } from '@src/ui/Icon';
import { SearchBar, useFuzzySearch } from '@src/ui/search';
import { ArticlePreviewModal } from '@src/features/article/ArticlePreviewModal';
import { useFormationStore } from '@src/stores/formation.store';
import { useArticleStore } from '@src/stores/article.store';
import { contentTypeIcon } from '@src/utils/article-meta';
import type { Article } from '@src/schemas/article.schema';
import type { Chapitre } from '@src/schemas/chapitre.schema';

const EMPTY_CHAPITRES: readonly Chapitre[] = [];

export default function AdminFormationArticlesScreen() {
  return (
    <RoleGate allowed={['admin']}>
      <Body />
    </RoleGate>
  );
}

function Body() {
  const { formationId } = useLocalSearchParams<{ formationId: string }>();
  const id = Number(formationId);

  const formation = useFormationStore((s) => s.byId(id));
  const formations = useFormationStore((s) => s.items);
  const formationStatus = useFormationStore((s) => s.status);
  const formationError = useFormationStore((s) => s.error);
  const loadFormations = useFormationStore((s) => s.load);
  const loadChapitres = useFormationStore((s) => s.loadChapitres);
  const chapitres =
    useFormationStore((s) => s.chapitresByFormation[id]) ?? EMPTY_CHAPITRES;
  const chapitresStatus = useFormationStore((s) => s.chapitresStatusOf(id));
  const chapitresError = useFormationStore((s) => s.chapitresErrorOf(id));

  const articlesByChapitre = useArticleStore((s) => s.byChapitre);
  const articleStatusByChapitre = useArticleStore((s) => s.status);
  const loadByChapitre = useArticleStore((s) => s.loadByChapitre);

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Article | null>(null);

  useEffect(() => {
    void loadFormations();
  }, [loadFormations]);

  useEffect(() => {
    if (formation) void loadChapitres(formation.id);
  }, [formation, loadChapitres]);

  useEffect(() => {
    for (const c of chapitres) {
      void loadByChapitre(c.id, [...(c.contents ?? [])]);
    }
  }, [chapitres, loadByChapitre]);

  const allArticles = useMemo<readonly Article[]>(() => {
    const result: Article[] = [];
    for (const c of chapitres) {
      const arr = articlesByChapitre[c.id] ?? [];
      for (const a of arr) result.push(a);
    }
    return result;
  }, [chapitres, articlesByChapitre]);

  const filteredArticles = useFuzzySearch(allArticles, ['title', 'type'], query);
  const filteredIds = useMemo(
    () => new Set(filteredArticles.map((a) => a.id)),
    [filteredArticles],
  );

  const sortedChapitres = useMemo<readonly Chapitre[]>(() => {
    return [...chapitres].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [chapitres]);

  const articlesLoading = chapitres.some(
    (c) => articleStatusByChapitre[c.id] === 'loading',
  );
  const isLoading =
    formationStatus === 'loading' ||
    (!formation && formations.length === 0) ||
    chapitresStatus === 'loading' ||
    articlesLoading;
  const error =
    formationError ??
    chapitresError ??
    (!formation && formations.length > 0 ? 'Formation introuvable.' : null);

  return (
    <ScreenShell
      back
      eyebrow="Formation"
      title={formation?.name ?? 'Détail'}
      subtitle="Chapitres et articles de cette formation."
    >
      {isLoading ? (
        <LoadingView />
      ) : error ? (
        <ErrorCard message={error} />
      ) : sortedChapitres.length === 0 ? (
        <EmptyState
          icon="library-outline"
          title="Aucun chapitre"
          description="Cette formation ne contient aucun chapitre."
        />
      ) : (
        <View className="gap-6">
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher un article…"
          />
          {filteredIds.size === 0 && query.length > 0 ? (
            <EmptyState
              icon="search-outline"
              title="Aucun résultat"
              description="Essayez un autre terme."
            />
          ) : (
            <View className="gap-7">
              {sortedChapitres.map((c) => {
                const articles = articlesByChapitre[c.id] ?? [];
                const visible = query.length > 0
                  ? articles.filter((a) => filteredIds.has(a.id))
                  : articles;
                if (query.length > 0 && visible.length === 0) return null;
                return (
                  <ChapterBlock
                    key={c.id}
                    chapter={c}
                    articles={visible}
                    onSelectArticle={setSelected}
                  />
                );
              })}
            </View>
          )}
        </View>
      )}

      <ArticlePreviewModal article={selected} onClose={() => setSelected(null)} />
    </ScreenShell>
  );
}

function ChapterBlock({
  chapter,
  articles,
  onSelectArticle,
}: {
  chapter: Chapitre;
  articles: readonly Article[];
  onSelectArticle: (a: Article) => void;
}) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center gap-3">
          <View className="size-9 items-center justify-center squircle-lg bg-primary/10">
            <Icon name="bookmark-outline" size={16} color="#7bd0ff" />
          </View>
          <Text className="flex-1 font-headline text-base font-bold text-on-surface">
            {chapter.title}
          </Text>
        </View>
        <Text className="font-headline text-xs font-bold text-on-surface-variant">
          {articles.length}
        </Text>
      </View>

      {articles.length === 0 ? (
        <View className="squircle-xl bg-surface-container p-4 ghost-border">
          <Text className="text-sm text-on-surface-variant">Aucun article.</Text>
        </View>
      ) : (
        <View className="gap-3 pl-3">
          {articles.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => onSelectArticle(a)}
              accessibilityRole="button"
              accessibilityLabel={`Prévisualiser ${a.title}`}
              className="flex-row items-center gap-4 squircle-xl bg-surface-container p-4 ghost-border"
            >
              <View className="size-10 items-center justify-center squircle-lg bg-primary/10">
                <Icon name={contentTypeIcon(a.type)} size={20} color="#7bd0ff" />
              </View>
              <View className="flex-1">
                <Text className="font-headline text-base font-bold text-on-surface">
                  {a.title}
                </Text>
                <Text className="text-xs uppercase tracking-widest text-on-surface-variant">
                  {a.type}
                </Text>
              </View>
              <Icon name="chevron-forward" size={16} color="#a1a1aa" />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

