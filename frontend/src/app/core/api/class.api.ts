import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, tap, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { ClassroomSchema, type Classroom } from '../schemas/class.schema';
import { parseResponse, parseHydraCollection } from './parse-response';
import { ResourceCache } from './resource-cache';
import { iriToId } from '../utils/iri';

@Injectable({ providedIn: 'root' })
export class ClassApi {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(ResourceCache);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Liste toutes les classes d'une école.
   *
   * Le backend API Platform peut accepter le filtre `school=` sur différents
   * formats (id numérique, IRI ou pas du tout). Pour être robuste on envoie le
   * filtre puis on re-filtre côté client à partir de l'IRI `/api/schools/{id}`
   * embarquée dans chaque classroom — comme ça la liste est toujours correcte
   * même si le backend ignore le query param.
   */
  listBySchool(schoolId: number): Observable<Classroom[]> {
    return this.http
      .get<unknown>(`${this.apiUrl}/classrooms`, {
        params: { school: String(schoolId) },
      })
      .pipe(
        parseHydraCollection(ClassroomSchema),
        map((items) =>
          items.filter((c) => {
            if (!c.school) return true;
            return iriToId(c.school) === schoolId;
          }),
        ),
        catchError(this.toError),
      );
  }

  /**
   * Récupère une classe par son identifiant numérique.
   */
  getById(id: number): Observable<Classroom> {
    return this.http
      .get<unknown>(`${this.apiUrl}/classrooms/${id}`)
      .pipe(parseResponse(ClassroomSchema), catchError(this.toError));
  }

  /**
   * Charge plusieurs classes à partir de leurs IRIs (ex: ["/api/classrooms/1", ...]).
   */
  getByIris(classIris: string[]): Observable<Classroom[]> {
    if (classIris.length === 0) return of([]);
    const requests = classIris.map((iri) => {
      const url = `${this.apiUrl}/classrooms/${iriToId(iri)}`;
      return this.cache.get(url, () =>
        this.http.get<unknown>(url).pipe(parseResponse(ClassroomSchema)),
      );
    });
    return forkJoin(requests).pipe(catchError(this.toError));
  }

  /**
   * Crée une nouvelle classe dans une école (admin only).
   */
  create(payload: {
    name: string;
    slug: string;
    level: string;
    school_id: number;
  }): Observable<Classroom> {
    return this.http
      .post<unknown>(`${this.apiUrl}/classrooms`, payload)
      .pipe(parseResponse(ClassroomSchema), catchError(this.toError));
  }

  /**
   * Met à jour une classe existante (admin / school).
   */
  update(
    id: number,
    payload: Partial<{ name: string; slug: string; level: string }>,
  ): Observable<Classroom> {
    return this.http
      .patch<unknown>(`${this.apiUrl}/classrooms/${id}`, payload)
      .pipe(
        parseResponse(ClassroomSchema),
        tap(() => this.cache.invalidate(`${this.apiUrl}/classrooms/${id}`)),
        catchError(this.toError),
      );
  }

  /**
   * Supprime une classe (admin uniquement).
   */
  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/classrooms/${id}`)
      .pipe(
        tap(() => this.cache.invalidate(`${this.apiUrl}/classrooms/${id}`)),
        catchError(this.toError),
      );
  }

  private readonly toError = (error: unknown): Observable<never> => {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403) {
        return throwError(() => new Error('Accès refusé.'));
      }
      if (error.status === 404) {
        return throwError(() => new Error('Classe introuvable.'));
      }
      return throwError(() => new Error('Impossible de charger les classes.'));
    }
    return throwError(() => error);
  };
}
