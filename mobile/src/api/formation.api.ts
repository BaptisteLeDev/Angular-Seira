import { z } from 'zod';
import { apiRequest } from './client';
import { parseResponse } from './parse-response';
import { fetchHydraAll } from './pagination';
import {
  ChapitreSchema,
  type Chapitre,
} from '@src/schemas/chapitre.schema';
import {
  FormationSchema,
  type Formation,
} from '@src/schemas/formation.schema';
import { iriToId } from '@src/utils/iri';

const MySubjectsSchema = z.object({
  available: z.array(FormationSchema),
  locked: z.array(FormationSchema),
});
export type MySubjects = z.infer<typeof MySubjectsSchema>;

export const FormationApi = {
  async list(params: { schoolId?: number | null } = {}): Promise<Formation[]> {
    const search = new URLSearchParams();
    if (params.schoolId != null) search.set('school', String(params.schoolId));
    const qs = search.toString();
    return fetchHydraAll(`/subjects${qs.length > 0 ? `?${qs}` : ''}`, FormationSchema);
  },

  async listForMe(): Promise<MySubjects> {
    const raw = await apiRequest<unknown>('/me/subjects');
    return MySubjectsSchema.parse(raw);
  },

  async getById(id: number): Promise<Formation> {
    const raw = await apiRequest<unknown>(`/subjects/${id}`);
    return parseResponse(FormationSchema, raw);
  },

  async getChapitresByIris(chapterIris: string[]): Promise<Chapitre[]> {
    const ids = chapterIris.map(iriToId).filter((id): id is number => id != null);
    if (ids.length === 0) return [];
    return Promise.all(
      ids.map(async (id) => {
        const raw = await apiRequest<unknown>(`/chapters/${id}`);
        return parseResponse(ChapitreSchema, raw);
      }),
    );
  },
};
