import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { SchoolSchema, type School } from '../schemas/school.schema';
import { parseResponse, parseHydraCollection } from './parse-response';

@Injectable({ providedIn: 'root' })
export class SchoolApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Récupère toutes les écoles (admin uniquement côté back).
   */
  list(): Observable<School[]> {
    return this.http
      .get<unknown>(`${this.apiUrl}/schools`)
      .pipe(parseHydraCollection(SchoolSchema), catchError(this.toError));
  }

  /**
   * Récupère une école par son identifiant numérique.
   */
  getById(id: number): Observable<School> {
    return this.http
      .get<unknown>(`${this.apiUrl}/schools/${id}`)
      .pipe(parseResponse(SchoolSchema), catchError(this.toError));
  }

  /**
   * Crée une nouvelle école (admin uniquement).
   */
  create(payload: Pick<School, 'name' | 'slug'>): Observable<School> {
    return this.http
      .post<unknown>(`${this.apiUrl}/schools`, payload)
      .pipe(parseResponse(SchoolSchema), catchError(this.toError));
  }

  /**
   * Met à jour une école existante (admin uniquement).
   */
  update(
    id: number,
    payload: Partial<Pick<School, 'name' | 'slug'>>,
  ): Observable<School> {
    return this.http
      .patch<unknown>(`${this.apiUrl}/schools/${id}`, payload)
      .pipe(parseResponse(SchoolSchema), catchError(this.toError));
  }

  /**
   * Supprime une école (admin uniquement).
   */
  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/schools/${id}`)
      .pipe(catchError(this.toError));
  }

  private readonly toError = (error: unknown): Observable<never> => {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403) {
        return throwError(() => new Error('Accès refusé.'));
      }
      if (error.status === 404) {
        return throwError(() => new Error('École introuvable.'));
      }
      return throwError(() => new Error('Impossible de charger les écoles.'));
    }
    return throwError(() => error);
  };
}
