import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  password_confirmation: string;
}

interface AuthApiResponse {
  message: string;
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

interface RefreshApiResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly tokenStorageKey = 'seira.auth.token';
  private readonly currentUserSignal = signal<User | null>(null);

  readonly currentUser = computed(() => this.currentUserSignal());

  constructor() {
    const token = this.getToken();
    if (!token) {
      return;
    }

    this.me().subscribe({
      next: (user) => this.currentUserSignal.set(user),
      error: () => this.clearSession(),
    });
  }

  login(email: string, password: string): Observable<LoginResponse> {
    const payload: LoginRequest = { email, password };
    return this.http.post<AuthApiResponse>(`${this.apiUrl}/auth/login`, payload).pipe(
      tap((response) => {
        this.persistToken(response.access_token);
        this.currentUserSignal.set(response.user);
      }),
      map((response) => ({ accessToken: response.access_token, user: response.user })),
      catchError((error: unknown) => this.toUserFacingError(error, 'Connexion impossible.')),
    );
  }

  register(payload: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<AuthApiResponse>(`${this.apiUrl}/auth/register`, payload).pipe(
      tap((response) => {
        this.persistToken(response.access_token);
        this.currentUserSignal.set(response.user);
      }),
      map((response) => ({ accessToken: response.access_token, user: response.user })),
      catchError((error: unknown) => this.toUserFacingError(error, 'Inscription impossible.')),
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/logout`, {}).pipe(
      tap(() => this.clearSession()),
      catchError((error: unknown) => {
        this.clearSession();
        return this.toUserFacingError(error, 'Deconnexion effectuee localement.');
      }),
    );
  }

  me(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/me`).pipe(
      tap((user) => this.currentUserSignal.set(user)),
      catchError((error: unknown) => this.toUserFacingError(error, 'Session invalide.')),
    );
  }

  refreshToken(): Observable<string> {
    return this.http.post<RefreshApiResponse>(`${this.apiUrl}/auth/refresh`, {}).pipe(
      tap((response) => this.persistToken(response.access_token)),
      map((response) => response.access_token),
      catchError((error: unknown) => this.toUserFacingError(error, 'Renouvellement du token impossible.')),
    );
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenStorageKey);
  }

  private persistToken(token: string): void {
    localStorage.setItem(this.tokenStorageKey, token);
  }

  private clearSession(): void {
    localStorage.removeItem(this.tokenStorageKey);
    this.currentUserSignal.set(null);
  }

  private toUserFacingError(error: unknown, fallbackMessage: string): Observable<never> {
    if (error instanceof HttpErrorResponse) {
      const apiMessage = this.extractApiErrorMessage(error);
      return throwError(() => new Error(apiMessage ?? fallbackMessage));
    }

    return throwError(() => new Error(fallbackMessage));
  }

  private extractApiErrorMessage(error: HttpErrorResponse): string | null {
    const body = error.error;
    if (typeof body === 'string' && body.length > 0) {
      return body;
    }

    if (
      body &&
      typeof body === 'object' &&
      'message' in body &&
      typeof body.message === 'string' &&
      body.message.length > 0
    ) {
      return body.message;
    }

    return null;
  }
}
