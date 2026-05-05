import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { UserSchema, type User, type UserRole } from '../schemas/user.schema';
import { parseResponse, parseHydraCollection } from './parse-response';

export interface UserScope {
  readonly role?: UserRole;
  readonly schoolId?: number;
}

export interface UserCreatePayload {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly role: UserRole;
  readonly schoolId?: number | null;
}

export type UserUpdatePayload = Partial<Omit<UserCreatePayload, 'password'>> & {
  readonly password?: string;
};

@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  list(scope?: UserScope): Observable<User[]> {
    let params = new HttpParams();
    if (scope?.role) params = params.set('role', scope.role);
    if (typeof scope?.schoolId === 'number') {
      params = params.set('schoolId', String(scope.schoolId));
    }
    return this.http
      .get<unknown>(`${this.apiUrl}/users`, { params })
      .pipe(parseHydraCollection(UserSchema), catchError(this.toError));
  }

  getById(id: number): Observable<User> {
    return this.http
      .get<unknown>(`${this.apiUrl}/users/${id}`)
      .pipe(parseResponse(UserSchema), catchError(this.toError));
  }

  create(payload: UserCreatePayload): Observable<User> {
    return this.http
      .post<unknown>(`${this.apiUrl}/users`, payload)
      .pipe(parseResponse(UserSchema), catchError(this.toError));
  }

  update(id: number, payload: UserUpdatePayload): Observable<User> {
    return this.http
      .patch<unknown>(`${this.apiUrl}/users/${id}`, payload)
      .pipe(parseResponse(UserSchema), catchError(this.toError));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/users/${id}`)
      .pipe(catchError(this.toError));
  }

  private readonly toError = (error: unknown): Observable<never> => {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403) return throwError(() => new Error('Accès refusé.'));
      if (error.status === 404) return throwError(() => new Error('Utilisateur introuvable.'));
      if (error.status === 422) {
        return throwError(() => new Error('Données invalides.'));
      }
      return throwError(() => new Error('Erreur côté utilisateurs.'));
    }
    return throwError(() => error);
  };
}
