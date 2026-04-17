import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { ClassApi } from '../api/class.api';
import type { Classroom } from '../schemas/class.schema';

type Status = 'idle' | 'loading' | 'error';

/**
 * Store signal pour les classes (Classroom).
 *
 * Les classes sont regroupées par école : `_bySchool[schoolId] = Classroom[]`.
 */
@Injectable({ providedIn: 'root' })
export class ClassStore {
  private readonly api = inject(ClassApi);

  // ── State ────────────────────────────────────────────────────────────────
  private readonly _bySchool  = signal<Record<number, Classroom[]>>({});
  private readonly _selected  = signal<Classroom | null>(null);
  private readonly _status    = signal<Status>('idle');
  private readonly _error     = signal<string | null>(null);

  // ── Public (read-only) ───────────────────────────────────────────────────
  readonly bySchool  = this._bySchool.asReadonly();
  readonly selected  = this._selected.asReadonly();
  readonly status    = this._status.asReadonly();
  readonly error     = this._error.asReadonly();

  readonly isLoading = computed(() => this._status() === 'loading');
  readonly hasError  = computed(() => this._status() === 'error');

  // ── Queries ──────────────────────────────────────────────────────────────
  forSchool(schoolId: number): Classroom[] {
    return this._bySchool()[schoolId] ?? [];
  }

  // ── List by school ───────────────────────────────────────────────────────
  loadBySchool(schoolId: number, force = false): Observable<Classroom[]> {
    if (!force && this._bySchool()[schoolId]) {
      return new Observable((s) => { s.next(this.forSchool(schoolId)); s.complete(); });
    }

    this._status.set('loading');
    this._error.set(null);

    return this.api.listBySchool(schoolId).pipe(
      tap((classrooms) => {
        this._bySchool.update((map) => ({ ...map, [schoolId]: classrooms }));
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
  loadById(id: number): Observable<Classroom> {
    this._status.set('loading');
    this._error.set(null);

    return this.api.getById(id).pipe(
      tap((classroom) => {
        this._selected.set(classroom);
        this._status.set('idle');
      }),
      catchError((err: unknown) => {
        this._status.set('error');
        this._error.set(err instanceof Error ? err.message : 'Classe introuvable.');
        return throwError(() => err);
      }),
    );
  }

  // ── Mutations ────────────────────────────────────────────────────────────
  create(payload: {
    name: string;
    slug: string;
    level: string;
    school_id: number;
  }): Observable<Classroom> {
    return this.api.create(payload).pipe(
      tap((classroom) => {
        // Ajout dans le cache bySchool si l'école est déjà chargée
        const schoolIriId = extractIdFromIri(classroom.school);
        if (schoolIriId !== null) {
          this._bySchool.update((map) => ({
            ...map,
            [schoolIriId]: [classroom, ...(map[schoolIriId] ?? [])],
          }));
        }
      }),
      catchError((err: unknown) => {
        this._error.set(err instanceof Error ? err.message : 'Erreur création classe.');
        return throwError(() => err);
      }),
    );
  }

  update(
    id: number,
    payload: Partial<{ name: string; slug: string; level: string }>,
  ): Observable<Classroom> {
    return this.api.update(id, payload).pipe(
      tap((classroom) => {
        if (this._selected()?.id === id) this._selected.set(classroom);
        // Patch dans bySchool
        this._bySchool.update((map) => {
          const updated = { ...map };
          for (const key of Object.keys(updated)) {
            const schoolId = Number(key);
            updated[schoolId] = updated[schoolId].map((c) => (c.id === id ? classroom : c));
          }
          return updated;
        });
      }),
      catchError((err: unknown) => {
        this._error.set(err instanceof Error ? err.message : 'Erreur mise à jour classe.');
        return throwError(() => err);
      }),
    );
  }

  delete(id: number): Observable<void> {
    return this.api.delete(id).pipe(
      tap(() => {
        if (this._selected()?.id === id) this._selected.set(null);
        this._bySchool.update((map) => {
          const updated = { ...map };
          for (const key of Object.keys(updated)) {
            const schoolId = Number(key);
            updated[schoolId] = updated[schoolId].filter((c) => c.id !== id);
          }
          return updated;
        });
      }),
      catchError((err: unknown) => {
        this._error.set(err instanceof Error ? err.message : 'Erreur suppression classe.');
        return throwError(() => err);
      }),
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  clearSelected(): void {
    this._selected.set(null);
  }

  reset(): void {
    this._bySchool.set({});
    this._selected.set(null);
    this._status.set('idle');
    this._error.set(null);
  }
}

/** Extrait l'id numérique d'une IRI ex: "/api/schools/3" → 3 */
function extractIdFromIri(iri: string | undefined): number | null {
  if (!iri) return null;
  const match = /\/(\d+)$/.exec(iri);
  return match ? Number(match[1]) : null;
}
