import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, switchMap, tap, throwError } from 'rxjs';
import { AuthApi } from '../api/auth.api';
import { UserSchema, type User, type UserRole } from '../schemas/user.schema';
import type { LoginRequest } from '../schemas/auth.schema';

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

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly status = this._status.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);

  // ── Role helpers ────────────────────────────────────────────────────────────
  readonly isAdmin   = computed(() => this._user()?.role === 'admin');
  readonly isTeacher = computed(() => this._user()?.role === 'teacher');
  readonly isStudent = computed(() => this._user()?.role === 'student');

  /**
   * Retourne `true` si l'utilisateur possède au moins un des rôles listés.
   * Utilisé par `roleGuard`.
   */
  hasAnyRole(roles: UserRole[]): boolean {
    const role = this._user()?.role;
    if (!role) return false;
    return roles.includes(role);
  }

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

  login(payload: LoginRequest): Observable<User> {
    this._status.set('loading');
    this._error.set(null);
    return this.api.login(payload).pipe(
      tap((response) => {
        this.persistToken(response.token);
      }),
      switchMap(() => this.api.me()),
      tap((user) => {
        this.persistUser(user);
        this._status.set('idle');
      }),
      catchError((error: unknown) => {
        this._status.set('error');
        const message = toUserMessage(error);
        this._error.set(message);
        return throwError(() => new Error(message));
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

  getToken(): string | null {
    return this._token();
  }

  clearSession(): void {
    this._token.set(null);
    this._user.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
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

function toUserMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'Serveur inaccessible.';
    if (error.status === 401 || error.status === 403) return 'Email ou mot de passe incorrect.';
    if (error.status === 422) return 'Email ou mot de passe incorrect.';
    return 'Erreur de connexion.';
  }
  if (error instanceof Error && error.message) {
    if (error.message.includes('inaccessible') || error.message.includes('injoignable')) {
      return error.message;
    }
    if (error.message.includes('invalide') || error.message.includes('incorrect')) {
      return error.message;
    }
  }
  return 'Erreur de connexion.';
}
