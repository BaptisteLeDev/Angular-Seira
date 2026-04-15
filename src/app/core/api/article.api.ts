import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { ArticleListSchema, ArticleSchema, type Article } from '../schemas/article.schema';
import { parseResponse } from './parse-response';

@Injectable({ providedIn: 'root' })
export class ArticleApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly endpoints = {
    articles: '/articles',
    chapitres: '/chapitres',
  } as const;

  list(): Observable<Article[]> {
    return this.http
      .get<unknown>(`${this.apiUrl}${this.endpoints.articles}`)
      .pipe(parseResponse(ArticleListSchema), catchError(this.toError));
  }

  getById(id: number): Observable<Article> {
    return this.http
      .get<unknown>(`${this.apiUrl}${this.endpoints.articles}/${id}`)
      .pipe(parseResponse(ArticleSchema), catchError(this.toError));
  }

  listByChapitre(chapitreId: number): Observable<Article[]> {
    return this.http
      .get<unknown>(`${this.apiUrl}${this.endpoints.chapitres}/${chapitreId}/articles`)
      .pipe(parseResponse(ArticleListSchema), catchError(this.toError));
  }

  private readonly toError = (error: unknown): Observable<never> => {
    if (error instanceof HttpErrorResponse) {
      return throwError(() => new Error('Impossible de charger les articles.'));
    }
    return throwError(() => error);
  };
}
