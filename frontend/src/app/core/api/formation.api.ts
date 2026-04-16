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
