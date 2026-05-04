import { apiRequest } from './client';
import { parseHydraCollection } from './parse-response';
import { ClassroomSchema, type Classroom } from '@src/schemas/classroom.schema';
import { iriToId } from '@src/utils/iri';

function classroomSchoolId(c: Classroom): number | null {
  if (c.schoolId != null) return c.schoolId;
  if (c.school) {
    try {
      return Number(iriToId(c.school));
    } catch {
      return null;
    }
  }
  return null;
}

export const ClassroomApi = {
  async list(params: { schoolId?: number | null } = {}): Promise<Classroom[]> {
    const raw = await apiRequest<unknown>('/classrooms');
    const all = parseHydraCollection(ClassroomSchema, raw);
    if (params.schoolId == null) return all;
    return all.filter((c) => classroomSchoolId(c) === params.schoolId);
  },
};
