import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, shareReplay, tap, throwError } from 'rxjs';
import { AuthApi } from '../api/auth.api';
import { UserSchema, type User } from '../schemas/user.schema';
import type { LoginRequest, RegisterRequest } from '../schemas/auth.schema';
import { isJwtExpired } from '../utils/jwt';

export interface LoginResult {
  readonly accessToken: string;
  readonly user: User;
}

type Status = 'idle' | 'loading' | 'error';

const TOKEN_KEY = 'seira.auth.token';
const USER_KEY = 'seira.auth.user';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(AuthApi);

  private readonly _user = signal<User | null>(null);
  private readonly _token = signal<string | null>(readToken());
  private readonly _status = signal<Status>('idle');
  private readonly _error = signal<string | null>(null);

  /**
   * Flight actif de refresh token. Si plusieurs requetes recoivent un 401 en
   * parallele, elles s'abonnent toutes au meme observable pour declencher un
   * unique appel `/auth/refresh`.
   */
  private refreshInFlight$: Observable<string> | null = null;

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly status = this._status.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);

  constructor() {
    const persisted = readPersistedUser();
    if (persisted) {
      this._user.set(persisted);
    }

    if (this._token()) {
      this.api.me().subscribe({
        next: (user) => this.persistUser(user),
        error: (error: unknown) => {
          if (isUnauthorized(error)) {
            this.clearSession();
          }
        },
      });
    }
  }

  login(payload: LoginRequest): Observable<LoginResult> {
    this._status.set('loading');
    this._error.set(null);
    return this.api.login(payload).pipe(
      tap((response) => {
        this.persistToken(response.access_token);
        this.persistUser(response.user);
        this._status.set('idle');
      }),
      map((response) => ({ accessToken: response.access_token, user: response.user })),
      catchError((error: unknown) => {
        this._status.set('error');
        this._error.set(error instanceof Error ? error.message : 'Connexion impossible.');
        return throwError(() => error);
      }),
    );
  }

  register(payload: RegisterRequest): Observable<LoginResult> {
    this._status.set('loading');
    this._error.set(null);
    return this.api.register(payload).pipe(
      tap((response) => {
        this.persistToken(response.access_token);
        this.persistUser(response.user);
        this._status.set('idle');
      }),
      map((response) => ({ accessToken: response.access_token, user: response.user })),
      catchError((error: unknown) => {
        this._status.set('error');
        this._error.set(error instanceof Error ? error.message : 'Inscription impossible.');
        return throwError(() => error);
      }),
    );
  }

  logout(): Observable<void> {
    return this.api.logout().pipe(
      tap(() => this.clearSession()),
      catchError((error: unknown) => {
        this.clearSession();
        return throwError(() => error);
      }),
    );
  }

  /**
   * Observable partage (single-flight) qui demande un nouveau token et met a
   * jour le store. Si un refresh est deja en cours, retourne le meme flux.
   */
  refreshToken(): Observable<string> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    this.refreshInFlight$ = this.api.refresh().pipe(
      tap((response) => this.persistToken(response.access_token)),
      map((response) => response.access_token),
      shareReplay({ bufferSize: 1, refCount: false }),
      finalize(() => {
        this.refreshInFlight$ = null;
      }),
    );

    return this.refreshInFlight$;
  }

  getToken(): string | null {
    return this._token();
  }

  /** Vide le JWT + utilisateur + localStorage. Appele par l'intercepteur sur 401. */
  clearSession(): void {
    this._token.set(null);
    this._user.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /** True si absent, malforme ou expire. Utilise par le guard. */
  isTokenExpired(): boolean {
    return isJwtExpired(this._token());
  }

  private persistToken(token: string): void {
    this._token.set(token);
    localStorage.setItem(TOKEN_KEY, token);
  }

  private persistUser(user: User): void {
    this._user.set(user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function readPersistedUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = UserSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403);
}
