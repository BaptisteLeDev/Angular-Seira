import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import {
  UserApi,
  type UserCreatePayload,
  type UserScope,
  type UserUpdatePayload,
} from '../api/user.api';
import type { User } from '../schemas/user.schema';

type Status = 'idle' | 'loading' | 'error';

function sameScope(a: UserScope | null, b: UserScope | null): boolean {
  return (a?.role ?? null) === (b?.role ?? null) && (a?.schoolId ?? null) === (b?.schoolId ?? null);
}

@Injectable({ providedIn: 'root' })
export class UserStore {
  private readonly api = inject(UserApi);

  private readonly _items = signal<readonly User[]>([]);
  private readonly _status = signal<Status>('idle');
  private readonly _error = signal<string | null>(null);
  private readonly _scope = signal<UserScope | null>(null);

  readonly items = this._items.asReadonly();
  readonly status = this._status.asReadonly();
  readonly error = this._error.asReadonly();
  readonly currentScope = this._scope.asReadonly();
  readonly isLoading = computed(() => this._status() === 'loading');

  load(scope: UserScope = {}, force = false): void {
    if (!force && sameScope(this._scope(), scope) && this._items().length > 0) return;
    this._status.set('loading');
    this._error.set(null);
    this._scope.set(scope);
    this.api.list(scope).subscribe({
      next: (items) => {
        this._items.set(items);
        this._status.set('idle');
      },
      error: (err: unknown) => {
        this._status.set('error');
        this._error.set(err instanceof Error ? err.message : 'Erreur de chargement.');
      },
    });
  }

  create(payload: UserCreatePayload): Observable<User> {
    return this.api.create(payload).pipe(
      tap((user) => this._items.update((list) => [user, ...list])),
      catchError((err: unknown) => {
        this._error.set(err instanceof Error ? err.message : 'Erreur création.');
        return throwError(() => err);
      }),
    );
  }

  update(id: number, payload: UserUpdatePayload): Observable<User> {
    return this.api.update(id, payload).pipe(
      tap((user) =>
        this._items.update((list) => list.map((u) => (u.id === id ? user : u))),
      ),
      catchError((err: unknown) => {
        this._error.set(err instanceof Error ? err.message : 'Erreur mise à jour.');
        return throwError(() => err);
      }),
    );
  }

  delete(id: number): Observable<void> {
    return this.api.delete(id).pipe(
      tap(() => this._items.update((list) => list.filter((u) => u.id !== id))),
      catchError((err: unknown) => {
        this._error.set(err instanceof Error ? err.message : 'Erreur suppression.');
        return throwError(() => err);
      }),
    );
  }
}
