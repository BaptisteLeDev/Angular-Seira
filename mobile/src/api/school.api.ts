import { apiRequest } from './client';
import { parseResponse } from './parse-response';
import { fetchHydraAll } from './pagination';
import { SchoolSchema, type School } from '@src/schemas/school.schema';

export const SchoolApi = {
  async list(): Promise<School[]> {
    return fetchHydraAll('/schools', SchoolSchema);
  },

  async getById(id: number): Promise<School> {
    const raw = await apiRequest<unknown>(`/schools/${id}`);
    return parseResponse(SchoolSchema, raw);
  },
};
