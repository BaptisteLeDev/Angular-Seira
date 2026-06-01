import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { SchoolApi } from '../api/school.api';
import type { School } from '../schemas/school.schema';

type Status = 'idle' | 'loading' | 'error';

@Injectable({ providedIn: 'root' })
export class SchoolStore {
  private readonly api = inject(SchoolApi);

  // ── State ────────────────────────────────────────────────────────────────
  private readonly _items  = signal<School[]>([]);
  private readonly _selected = signal<School | null>(null);
  private readonly _status = signal<Status>('idle');
  private readonly _error  = signal<string | null>(null);

  // ── Public signals (read-only) ───────────────────────────────────────────
  readonly items    = this._items.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly status   = this._status.asReadonly();
  readonly error    = this._error.asReadonly();

  readonly isLoading = computed(() => this._status() === 'loading');
  readonly hasError  = computed(() => this._status() === 'error');

  // ── List ─────────────────────────────────────────────────────────────────
  /**
   * Charge toutes les écoles.
   * @param force - force le rechargement même si des données existent
   */
  load(force = false): Observable<School[]> {
    if (!force && this._items().length > 0) {
      return new Observable((s) => { s.next(this._items()); s.complete(); });
    }

    this._status.set('loading');
    this._error.set(null);

    return this.api.list().pipe(
      tap((schools) => {
        this._items.set(schools);
        this._status.set('idle');
      }),
      catchError((err: unknown) => {
        this._status.set('error');
        this._error.set(err instanceof Error ? err.message : 'Erreur inattendue.');
        return throwError(() => err);
      }),
    );
  }

  // ── Single ───────────────────────────────────────────────────────────────
  /**
   * Charge une école par son id et la place dans `selected`.
   */
  loadById(id: number): Observable<School> {
    this._status.set('loading');
    this._error.set(null);

    return this.api.getById(id).pipe(
      tap((school) => {
        this._selected.set(school);
        // Met à jour le cache list si l'entrée existe déjà
        this._items.update((list) => {
          const idx = list.findIndex((s) => s.id === id);
          return idx >= 0
            ? list.map((s) => (s.id === id ? school : s))
            : [...list, school];
        });
        this._status.set('idle');
      }),
      catchError((err: unknown) => {
        this._status.set('error');
        this._error.set(err instanceof Error ? err.message : 'École introuvable.');
        return throwError(() => err);
      }),
    );
  }

  // ── Mutations ────────────────────────────────────────────────────────────
  create(payload: Pick<School, 'name' | 'slug'>): Observable<School> {
    return this.api.create(payload).pipe(
      tap((school) => this._items.update((list) => [school, ...list])),
      catchError((err: unknown) => {
        this._error.set(err instanceof Error ? err.message : 'Erreur création école.');
        return throwError(() => err);
      }),
    );
  }

  update(
    id: number,
    payload: Partial<Pick<School, 'name' | 'slug'>>,
  ): Observable<School> {
    return this.api.update(id, payload).pipe(
      tap((school) => {
        this._items.update((list) => list.map((s) => (s.id === id ? school : s)));
        if (this._selected()?.id === id) this._selected.set(school);
      }),
      catchError((err: unknown) => {
        this._error.set(err instanceof Error ? err.message : 'Erreur mise à jour école.');
        return throwError(() => err);
      }),
    );
  }

  delete(id: number): Observable<void> {
    return this.api.delete(id).pipe(
      tap(() => {
        this._items.update((list) => list.filter((s) => s.id !== id));
        if (this._selected()?.id === id) this._selected.set(null);
      }),
      catchError((err: unknown) => {
        this._error.set(err instanceof Error ? err.message : 'Erreur suppression école.');
        return throwError(() => err);
      }),
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  getById(id: number): School | undefined {
    return this._items().find((s) => s.id === id);
  }

  clearSelected(): void {
    this._selected.set(null);
  }

  reset(): void {
    this._items.set([]);
    this._selected.set(null);
    this._status.set('idle');
    this._error.set(null);
  }
}
