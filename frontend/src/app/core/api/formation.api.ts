import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, throwError } from 'rxjs';
import { z } from 'zod';
import { environment } from '@environments/environment';
import { ChapitreSchema, type Chapitre } from '../schemas/chapitre.schema';
import { FormationSchema, type Formation } from '../schemas/formation.schema';
import { parseResponse, parseHydraCollection } from './parse-response';
import { iriToId } from '../utils/iri';

/** Réponse de /me/subjects : matières accessibles + verrouillées (role-scopé). */
const MySubjectsSchema = z.object({
  available: z.array(FormationSchema),
  locked: z.array(FormationSchema),
});

@Injectable({ providedIn: 'root' })
export class FormationApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  list(): Observable<Formation[]> {
    return this.http
      .get<unknown>(`${this.apiUrl}/subjects`)
      .pipe(parseHydraCollection(FormationSchema), catchError(this.toError));
  }

  /**
   * Catalogue role-scopé via /me/subjects (utilisé pour les élèves, qui n'ont
   * pas accès à la collection /subjects). Renvoie les matières accessibles.
   */
  listForMe(): Observable<Formation[]> {
    return this.http
      .get<unknown>(`${this.apiUrl}/me/subjects`)
      .pipe(
        map((raw) => MySubjectsSchema.parse(raw).available),
        catchError(this.toError),
      );
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
      .pipe(parseResponse(ChapitreSchema), catchError(this.passError));
  }

  updateChapitre(
    id: number,
    payload: Partial<{ title: string; sortOrder: number }>,
  ): Observable<Chapitre> {
    return this.http
      .patch<unknown>(`${this.apiUrl}/chapters/${id}`, payload)
      .pipe(parseResponse(ChapitreSchema), catchError(this.passError));
  }

  deleteChapitre(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/chapters/${id}`)
      .pipe(catchError(this.passError));
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

  // Mutations : propage l'erreur HTTP brute (status + detail) pour un message précis.
  private readonly passError = (error: unknown): Observable<never> =>
    throwError(() => error);
}
