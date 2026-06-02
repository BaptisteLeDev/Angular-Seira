import { create } from 'zustand';
import { ArticleApi } from '@src/api/article.api';
import type { Article } from '@src/schemas/article.schema';

type Status = 'idle' | 'loading' | 'error';

type ArticleState = {
  byChapitre: Record<number, readonly Article[]>;
  status: Record<number, Status>;
  error: Record<number, string>;

  loadByChapitre: (chapitreId: number, contentIris: string[], force?: boolean) => Promise<void>;
  articlesOf: (chapitreId: number) => readonly Article[];
  statusOf: (chapitreId: number) => Status;
  errorOf: (chapitreId: number) => string | null;
  reset: (chapitreId?: number) => void;
};

export const useArticleStore = create<ArticleState>((set, get) => ({
  byChapitre: {},
  status: {},
  error: {},

  articlesOf(chapitreId) {
    return get().byChapitre[chapitreId] ?? [];
  },

  statusOf(chapitreId) {
    return get().status[chapitreId] ?? 'idle';
  },

  errorOf(chapitreId) {
    return get().error[chapitreId] ?? null;
  },

  async loadByChapitre(chapitreId, contentIris, force = false) {
    const state = get();
    const currentStatus = state.status[chapitreId];
    const alreadyLoaded = state.byChapitre[chapitreId] !== undefined;
    if (!force && (currentStatus === 'loading' || alreadyLoaded)) return;

    if (contentIris.length === 0) {
      set((s) => ({
        byChapitre: { ...s.byChapitre, [chapitreId]: [] },
        status: { ...s.status, [chapitreId]: 'idle' },
      }));
      return;
    }

    set((s) => ({
      status: { ...s.status, [chapitreId]: 'loading' },
      error: omit(s.error, chapitreId),
    }));

    try {
      // Tous les ChapterContent (y compris type vidéo), comme le web. La
      // relation `videos` n'est plus utilisée : c'était une représentation
      // parallèle (placeholders de seed) qui masquait les vraies vidéos-contenus.
      const contents = await ArticleApi.listByIris(contentIris);
      const sorted = [...contents].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      set((s) => ({
        byChapitre: { ...s.byChapitre, [chapitreId]: sorted },
        status: { ...s.status, [chapitreId]: 'idle' },
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de charger les contenus.';
      set((s) => ({
        status: { ...s.status, [chapitreId]: 'error' },
        error: { ...s.error, [chapitreId]: message },
      }));
    }
  },

  reset(chapitreId) {
    if (chapitreId === undefined) {
      set({ byChapitre: {}, status: {}, error: {} });
      return;
    }
    set((s) => ({
      byChapitre: omit(s.byChapitre, chapitreId),
      status: omit(s.status, chapitreId),
      error: omit(s.error, chapitreId),
    }));
  },
}));

function omit<K extends string | number, V>(record: Record<K, V>, key: K): Record<K, V> {
  const { [key]: _removed, ...rest } = record;
  return rest as Record<K, V>;
}
