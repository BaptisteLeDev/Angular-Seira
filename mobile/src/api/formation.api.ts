import { z } from 'zod';
import { apiRequest } from './client';
import { parseHydraCollection, parseResponse } from './parse-response';
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
    const raw = await apiRequest<unknown>(`/subjects${qs.length > 0 ? `?${qs}` : ''}`);
    return parseHydraCollection(FormationSchema, raw);
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
    if (chapterIris.length === 0) return [];
    return Promise.all(
      chapterIris.map(async (iri) => {
        const raw = await apiRequest<unknown>(`/chapters/${iriToId(iri)}`);
        return parseResponse(ChapitreSchema, raw);
      }),
    );
  },
};
