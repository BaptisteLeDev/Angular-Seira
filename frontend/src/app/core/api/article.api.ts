import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, of, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { ArticleSchema, type Article } from '../schemas/article.schema';
import { parseResponse } from './parse-response';
import { iriToId } from '../utils/iri';

@Injectable({ providedIn: 'root' })
export class ArticleApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getById(id: number): Observable<Article> {
    return this.http
      .get<unknown>(`${this.apiUrl}/chapter-contents/${id}`)
      .pipe(parseResponse(ArticleSchema), catchError(this.toError));
  }

  /**
   * Le backend Laravel attend `chapter_id` (numérique), pas l'IRI.
   */
  create(payload: {
    type: Article['type'];
    title: string;
    description?: string | null;
    content?: string | null;
    sourceUrl?: string | null;
    filePath?: string | null;
    durationSeconds?: number | null;
    sortOrder?: number;
    chapter_id: number;
    isPublished?: boolean;
  }): Observable<Article> {
    return this.http
      .post<unknown>(`${this.apiUrl}/chapter-contents`, payload)
      .pipe(parseResponse(ArticleSchema), catchError(this.toError));
  }

  update(
    id: number,
    payload: Partial<{
      type: Article['type'];
      title: string;
      description: string | null;
      content: string | null;
      sourceUrl: string | null;
      filePath: string | null;
      durationSeconds: number | null;
      sortOrder: number;
      isPublished: boolean;
    }>,
  ): Observable<Article> {
    return this.http
      .patch<unknown>(`${this.apiUrl}/chapter-contents/${id}`, payload)
      .pipe(parseResponse(ArticleSchema), catchError(this.toError));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/chapter-contents/${id}`)
      .pipe(catchError(this.toError));
  }

  /**
   * Charge les contenus a partir de leurs IRIs (ex: ["/api/chapter-contents/1", ...]).
   */
  listByIris(contentIris: string[]): Observable<Article[]> {
    if (contentIris.length === 0) return of([]);
    const requests = contentIris.map((iri) =>
      this.http
        .get<unknown>(`${this.apiUrl}/chapter-contents/${iriToId(iri)}`)
        .pipe(parseResponse(ArticleSchema)),
    );
    return forkJoin(requests).pipe(catchError(this.toError));
  }

  private readonly toError = (error: unknown): Observable<never> => {
    if (error instanceof HttpErrorResponse) {
      return throwError(() => new Error('Impossible de charger les contenus.'));
    }
    return throwError(() => error);
  };
}
