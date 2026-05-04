import { apiRequest } from './client';
import { parseHydraCollection, parseResponse } from './parse-response';
import { SchoolSchema, type School } from '@src/schemas/school.schema';

export const SchoolApi = {
  async list(): Promise<School[]> {
    const raw = await apiRequest<unknown>('/schools');
    return parseHydraCollection(SchoolSchema, raw);
  },

  async getById(id: number): Promise<School> {
    const raw = await apiRequest<unknown>(`/schools/${id}`);
    return parseResponse(SchoolSchema, raw);
  },
};
