import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { UserSchema, type User } from '../schemas/user.schema';
import {
  AuthResponseSchema,
  LoginRequestSchema,
  RefreshResponseSchema,
  RegisterRequestSchema,
  type AuthResponse,
  type LoginRequest,
  type RefreshResponse,
  type RegisterRequest,
} from '../schemas/auth.schema';
import { parseResponse } from './parse-response';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly endpoints = {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    me: '/auth/me',
    refresh: '/auth/refresh',
  } as const;

  login(payload: LoginRequest): Observable<AuthResponse> {
    const body = LoginRequestSchema.parse(payload);
    return this.http
      .post<unknown>(`${this.apiUrl}${this.endpoints.login}`, body)
      .pipe(parseResponse(AuthResponseSchema), catchError(this.toHttpError));
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    const body = RegisterRequestSchema.parse(payload);
    return this.http
      .post<unknown>(`${this.apiUrl}${this.endpoints.register}`, body)
      .pipe(parseResponse(AuthResponseSchema), catchError(this.toHttpError));
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.apiUrl}${this.endpoints.logout}`, {})
      .pipe(catchError(this.toHttpError));
  }

  me(): Observable<User> {
    return this.http
      .get<unknown>(`${this.apiUrl}${this.endpoints.me}`)
      .pipe(parseResponse(UserSchema), catchError(this.toHttpError));
  }

  refresh(): Observable<RefreshResponse> {
    return this.http
      .post<unknown>(`${this.apiUrl}${this.endpoints.refresh}`, {})
      .pipe(parseResponse(RefreshResponseSchema), catchError(this.toHttpError));
  }

  private readonly toHttpError = (error: unknown): Observable<never> => {
    if (error instanceof HttpErrorResponse) {
      const apiMessage = this.extractApiMessage(error);
      return throwError(() => new Error(apiMessage ?? defaultMessage(error.status)));
    }
    return throwError(() => error);
  };

  private extractApiMessage(error: HttpErrorResponse): string | null {
    const body = error.error;
    if (typeof body === 'string' && body.length > 0) return body;
    if (
      body &&
      typeof body === 'object' &&
      'message' in body &&
      typeof (body as { message: unknown }).message === 'string'
    ) {
      return (body as { message: string }).message;
    }
    return null;
  }
}

function defaultMessage(status: number): string {
  if (status === 401 || status === 403) return 'Session invalide ou expiree.';
  if (status === 422) return 'Donnees invalides.';
  if (status === 0) return 'Serveur injoignable.';
  return 'Erreur reseau.';
}
