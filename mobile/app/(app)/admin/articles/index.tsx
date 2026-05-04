import { useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';

import { RoleGate } from '@src/ui/RoleGate';
import { ScreenShell } from '@src/ui/ScreenShell';
import { LoadingView } from '@src/ui/LoadingView';
import { ErrorCard } from '@src/ui/ErrorCard';
import { EmptyState } from '@src/ui/EmptyState';
import { Icon } from '@src/ui/Icon';
import { useArticleListStore } from '@src/stores/article.list.store';
import type { Article } from '@src/schemas/article.schema';

export default function AdminArticlesScreen() {
  return (
    <RoleGate allowed={['admin']}>
      <Body />
    </RoleGate>
  );
}

type Group = { chapterId: number | null; items: Article[] };

function Body() {
  const items = useArticleListStore((s) => s.items);
  const status = useArticleListStore((s) => s.status);
  const error = useArticleListStore((s) => s.error);
  const loadAll = useArticleListStore((s) => s.loadAll);

  useEffect(() => {
    void loadAll(true);
  }, [loadAll]);

  const groups = useMemo<readonly Group[]>(() => {
    const map = new Map<number | null, Article[]>();
    for (const a of items) {
      const key = a.chapterId ?? null;
      const arr = map.get(key);
      if (arr) arr.push(a);
      else map.set(key, [a]);
    }
    const result: Group[] = [];
    for (const [chapterId, arr] of map) {
      arr.sort((x, y) => (x.sortOrder ?? 0) - (y.sortOrder ?? 0));
      result.push({ chapterId, items: arr });
    }
    result.sort((a, b) => {
      if (a.chapterId == null) return 1;
      if (b.chapterId == null) return -1;
      return a.chapterId - b.chapterId;
    });
    return result;
  }, [items]);

  return (
    <ScreenShell
      back
      backFallback="/admin"
      eyebrow="Administration"
      title="Tous les contenus"
      subtitle="Articles regroupés par chapitre."
    >
      {status === 'loading' ? (
        <LoadingView />
      ) : error ? (
        <ErrorCard message={error} />
      ) : groups.length === 0 ? (
        <EmptyState icon="document-text-outline" title="Aucun contenu" description="" />
      ) : (
        <View className="gap-8">
          {groups.map((g) => (
            <ChapterGroup key={String(g.chapterId)} group={g} />
          ))}
        </View>
      )}
    </ScreenShell>
  );
}

function ChapterGroup({ group }: { group: Group }) {
  const heading = group.chapterId == null ? 'Sans chapitre' : `Chapitre #${group.chapterId}`;
  return (
    <View>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="font-headline text-xs font-bold uppercase tracking-[3px] text-primary">
          {heading}
        </Text>
        <Text className="font-headline text-xs font-bold text-on-surface-variant">
          {group.items.length}
        </Text>
      </View>
      <View className="gap-3">
        {group.items.map((a) => (
          <View
            key={a.id}
            className="flex-row items-center gap-4 squircle-xl bg-surface-container p-4 ghost-border"
          >
            <View className="size-10 items-center justify-center squircle-lg bg-primary/10">
              <Icon name="document-text-outline" size={20} color="#7bd0ff" />
            </View>
            <View className="flex-1">
              <Text className="font-headline text-base font-bold text-on-surface">
                {a.title}
              </Text>
              <Text className="text-xs uppercase tracking-widest text-on-surface-variant">
                {a.type}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
