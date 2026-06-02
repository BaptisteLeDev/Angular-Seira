import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@environments/environment';
import {
  TeacherAggregateSchema,
  SchoolAggregateSchema,
  type TeacherSubjectAggregate,
  type SchoolClassroomAggregate,
} from '../schemas/aggregate.schema';

/**
 * Vues agrégées de progression (lecture seule).
 * - `teacher()` : matières → classes → élèves (formateur connecté / admin).
 * - `school()`  : classes → élèves → matières (admin de l'école).
 */
@Injectable({ providedIn: 'root' })
export class AggregateApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  teacher(): Observable<TeacherSubjectAggregate[]> {
    return this.http
      .get<unknown>(`${this.apiUrl}/aggregates/teacher`)
      .pipe(map((raw) => TeacherAggregateSchema.parse(raw)));
  }

  school(): Observable<SchoolClassroomAggregate[]> {
    return this.http
      .get<unknown>(`${this.apiUrl}/aggregates/school`)
      .pipe(map((raw) => SchoolAggregateSchema.parse(raw)));
  }
}
