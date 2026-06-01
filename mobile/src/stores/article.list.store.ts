import { create } from 'zustand';
import { ArticleApi } from '@src/api/article.api';
import type { Article } from '@src/schemas/article.schema';

type Status = 'idle' | 'loading' | 'error';

type ArticleListState = {
  items: readonly Article[];
  status: Status;
  error: string | null;
  loadAll: (force?: boolean) => Promise<void>;
};

export const useArticleListStore = create<ArticleListState>((set, get) => ({
  items: [],
  status: 'idle',
  error: null,

  async loadAll(force = false) {
    const { status, items } = get();
    if (!force && (status === 'loading' || items.length > 0)) return;
    set({ status: 'loading', error: null });
    try {
      const result = await ArticleApi.listAll();
      set({ items: result, status: 'idle' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de charger les articles.';
      set({ status: 'error', error: message });
    }
  },
}));
