import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, of, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { ChapitreSchema, type Chapitre } from '../schemas/chapitre.schema';
import { FormationSchema, type Formation } from '../schemas/formation.schema';
import { parseResponse, parseHydraCollection } from './parse-response';
import { iriToId } from '../utils/iri';

@Injectable({ providedIn: 'root' })
export class FormationApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  list(): Observable<Formation[]> {
    return this.http
      .get<unknown>(`${this.apiUrl}/subjects`)
      .pipe(parseHydraCollection(FormationSchema), catchError(this.toError));
  }

  getById(id: number): Observable<Formation> {
    return this.http
      .get<unknown>(`${this.apiUrl}/subjects/${id}`)
      .pipe(parseResponse(FormationSchema), catchError(this.toError));
  }

  create(payload: {
    name: string;
    description?: string | null;
    expectedHours?: number;
    school?: string;
    teacher?: string;
    classrooms?: string[];
  }): Observable<Formation> {
    return this.http
      .post<unknown>(`${this.apiUrl}/subjects`, payload)
      .pipe(parseResponse(FormationSchema), catchError(this.toError));
  }

  update(
    id: number,
    payload: Partial<{
      name: string;
      description: string | null;
      expectedHours: number;
      teacher: string;
      classrooms: string[];
    }>,
  ): Observable<Formation> {
    return this.http
      .patch<unknown>(`${this.apiUrl}/subjects/${id}`, payload)
      .pipe(parseResponse(FormationSchema), catchError(this.toError));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/subjects/${id}`)
      .pipe(catchError(this.toError));
  }

  // ── Chapitres CRUD ───────────────────────────────────────────────────────
  /**
   * Le backend Laravel/API Platform attend `subject_id` (numérique), pas l'IRI.
   */
  createChapitre(payload: {
    title: string;
    sortOrder: number;
    subject_id: number;
  }): Observable<Chapitre> {
    return this.http
      .post<unknown>(`${this.apiUrl}/chapters`, payload)
      .pipe(parseResponse(ChapitreSchema), catchError(this.toError));
  }

  updateChapitre(
    id: number,
    payload: Partial<{ title: string; sortOrder: number }>,
  ): Observable<Chapitre> {
    return this.http
      .patch<unknown>(`${this.apiUrl}/chapters/${id}`, payload)
      .pipe(parseResponse(ChapitreSchema), catchError(this.toError));
  }

  deleteChapitre(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/chapters/${id}`)
      .pipe(catchError(this.toError));
  }

  /**
   * Charge les chapitres a partir de leurs IRIs (ex: ["/api/chapters/1", ...]).
   * Chaque chapitre est fetche individuellement (3 par matiere en moyenne).
   */
  getChapitresByIris(chapterIris: string[]): Observable<Chapitre[]> {
    if (chapterIris.length === 0) return of([]);
    const requests = chapterIris.map((iri) =>
      this.http
        .get<unknown>(`${this.apiUrl}/chapters/${iriToId(iri)}`)
        .pipe(parseResponse(ChapitreSchema)),
    );
    return forkJoin(requests).pipe(catchError(this.toError));
  }

  private readonly toError = (error: unknown): Observable<never> => {
    if (error instanceof HttpErrorResponse) {
      return throwError(() => new Error('Impossible de charger les formations.'));
    }
    return throwError(() => error);
  };
}
