import { apiRequest } from './client';
import {
  TeacherAggregateSchema,
  type TeacherSubjectAggregate,
} from '@src/schemas/aggregate.schema';

/** Vues agrégées de progression (lecture seule). */
export const AggregateApi = {
  /** Matières → classes → élèves, pour le formateur connecté. */
  async teacher(): Promise<TeacherSubjectAggregate[]> {
    const raw = await apiRequest<unknown>('/aggregates/teacher');
    return TeacherAggregateSchema.parse(raw);
  },
};
