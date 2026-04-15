import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { ChapitreListSchema, type Chapitre } from '../schemas/chapitre.schema';
import { FormationListSchema, FormationSchema, type Formation } from '../schemas/formation.schema';
import { parseResponse } from './parse-response';

@Injectable({ providedIn: 'root' })
export class FormationApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly endpoints = {
    formations: '/formations',
  } as const;

  list(): Observable<Formation[]> {
    return this.http
      .get<unknown>(`${this.apiUrl}${this.endpoints.formations}`)
      .pipe(parseResponse(FormationListSchema), catchError(this.toError));
  }

  getById(id: number): Observable<Formation> {
    return this.http
      .get<unknown>(`${this.apiUrl}${this.endpoints.formations}/${id}`)
      .pipe(parseResponse(FormationSchema), catchError(this.toError));
  }

  getChapitres(formationId: number): Observable<Chapitre[]> {
    return this.http
      .get<unknown>(`${this.apiUrl}${this.endpoints.formations}/${formationId}/chapitres`)
      .pipe(parseResponse(ChapitreListSchema), catchError(this.toError));
  }

  private readonly toError = (error: unknown): Observable<never> => {
    if (error instanceof HttpErrorResponse) {
      return throwError(() => new Error('Impossible de charger les formations.'));
    }
    return throwError(() => error);
  };
}
