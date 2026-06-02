import { apiRequest } from './client';
import { parseHydraCollection, parseResponse } from './parse-response';
import { ArticleSchema, type Article } from '@src/schemas/article.schema';
import { iriToId } from '@src/utils/iri';

export const ArticleApi = {
  async getById(id: number): Promise<Article> {
    const raw = await apiRequest<unknown>(`/chapter-contents/${id}`);
    return parseResponse(ArticleSchema, raw);
  },

  async listByIris(contentIris: string[]): Promise<Article[]> {
    const ids = contentIris.map(iriToId).filter((id): id is number => id != null);
    if (ids.length === 0) return [];
    return Promise.all(
      ids.map(async (id) => {
        const raw = await apiRequest<unknown>(`/chapter-contents/${id}`);
        return parseResponse(ArticleSchema, raw);
      }),
    );
  },

  async listAll(): Promise<Article[]> {
    const raw = await apiRequest<unknown>('/chapter-contents');
    return parseHydraCollection(ArticleSchema, raw);
  },
};
