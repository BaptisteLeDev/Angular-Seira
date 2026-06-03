import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { FormationApi } from '../api/formation.api';
import { AuthStore } from './auth.store';
import type { Chapitre } from '../schemas/chapitre.schema';
import type { Formation } from '../schemas/formation.schema';

type Status = 'idle' | 'loading' | 'error';

@Injectable({ providedIn: 'root' })
export class FormationStore {
  private readonly api = inject(FormationApi);
  private readonly auth = inject(AuthStore);

  private readonly _items = signal<readonly Formation[]>([]);
  /** Matières hors parcours de l'élève (affichées verrouillées). */
  private readonly _locked = signal<readonly Formation[]>([]);
  private readonly _status = signal<Status>('idle');
  private readonly _error = signal<string | null>(null);
  private readonly _chapitresByFormation = signal<Record<number, readonly Chapitre[]>>({});
  private readonly _chapitresStatus = signal<Record<number, Status>>({});
  private readonly _chapitresError = signal<Record<number, string>>({});

  readonly items = this._items.asReadonly();
  readonly locked = this._locked.asReadonly();
  readonly status = this._status.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isLoading = computed(() => this._status() === 'loading');

  readonly byId = (id: number) => computed(() => this._items().find((f) => f.id === id) ?? null);

  readonly chapitresOf = (formationId: number) =>
    computed(() => this._chapitresByFormation()[formationId] ?? []);

  readonly chapitresStatusOf = (formationId: number) =>
    computed(() => this._chapitresStatus()[formationId] ?? 'idle');

  readonly chapitresErrorOf = (formationId: number) =>
    computed(() => this._chapitresError()[formationId] ?? null);

  load(force = false): void {
    if (!force && (this._status() === 'loading' || this._items().length > 0)) {
      return;
    }
    this._status.set('loading');
    this._error.set(null);
    // Les élèves n'ont pas accès à la collection /subjects (403) : on passe par
    // le catalogue role-scopé /me/subjects. Admin/prof gardent /subjects (qui
    // inclut déjà les IRIs de chapitres).
    if (this.auth.isStudent()) {
      this.api.listMine().subscribe({
        next: ({ available, locked }) => {
          this._items.set(available);
          this._locked.set(locked);
          this._status.set('idle');
        },
        error: (error: unknown) => {
          this._status.set('error');
          this._error.set(
            error instanceof Error ? error.message : 'Impossible de charger les formations.',
          );
        },
      });
      return;
    }

    this.api.list().subscribe({
      next: (items) => {
        this._items.set(items);
        this._status.set('idle');
      },
      error: (error: unknown) => {
        this._status.set('error');
        this._error.set(
          error instanceof Error ? error.message : 'Impossible de charger les formations.',
        );
      },
    });
  }

  /** Détails déjà en cours de chargement (dédup, non réactif). */
  private readonly detailLoading = new Set<number>();

  /**
   * Charge une formation complète via /subjects/{id}, qui inclut les IRIs de
   * chapitres. Indispensable pour les élèves : leur catalogue /me/subjects ne
   * renvoie pas ces IRIs. No-op si la formation est déjà complète (admin/prof
   * via /subjects) ou déjà en vol. Idempotent → sûr à appeler dans un effect.
   */
  loadOne(id: number): void {
    const existing = this._items().find((f) => f.id === id);
    if (existing?.chapters !== undefined || this.detailLoading.has(id)) {
      return;
    }
    this.detailLoading.add(id);
    this.api.getById(id).subscribe({
      next: (formation) => {
        this.detailLoading.delete(id);
        this._items.update((items) => {
          const exists = items.some((f) => f.id === formation.id);
          return exists
            ? items.map((f) => (f.id === formation.id ? formation : f))
            : [...items, formation];
        });
        // Les IRIs de chapitres viennent d'arriver : (re)charge les chapitres.
        this.loadChapitres(formation.id, true);
      },
      error: () => {
        this.detailLoading.delete(id);
        /* Détail inaccessible (403/404) : géré par l'UI via byId() null. */
      },
    });
  }

  // ── Mutations ────────────────────────────────────────────────────────────
  create(payload: Parameters<FormationApi['create']>[0]): Observable<Formation> {
    return this.api.create(payload).pipe(
      tap((formation) => this._items.update((items) => [formation, ...items])),
      catchError((err: unknown) => throwError(() => err)),
    );
  }

  update(
    id: number,
    payload: Parameters<FormationApi['update']>[1],
  ): Observable<Formation> {
    return this.api.update(id, payload).pipe(
      tap((formation) =>
        this._items.update((items) =>
          items.map((f) => (f.id === id ? formation : f)),
        ),
      ),
      catchError((err: unknown) => throwError(() => err)),
    );
  }

  delete(id: number): Observable<void> {
    return this.api.delete(id).pipe(
      tap(() => this._items.update((items) => items.filter((f) => f.id !== id))),
      catchError((err: unknown) => throwError(() => err)),
    );
  }

  createChapitre(
    formationId: number,
    payload: Parameters<FormationApi['createChapitre']>[0],
  ): Observable<Chapitre> {
    return this.api.createChapitre(payload).pipe(
      tap((chapitre) => {
        this._chapitresByFormation.update((state) => {
          const list = state[formationId] ?? [];
          const next = [...list, chapitre].sort((a, b) => a.sortOrder - b.sortOrder);
          return { ...state, [formationId]: next };
        });
      }),
      catchError((err: unknown) => throwError(() => err)),
    );
  }

  updateChapitre(
    formationId: number,
    id: number,
    payload: Parameters<FormationApi['updateChapitre']>[1],
  ): Observable<Chapitre> {
    return this.api.updateChapitre(id, payload).pipe(
      tap((chapitre) => {
        this._chapitresByFormation.update((state) => {
          const list = state[formationId] ?? [];
          const next = list.map((c) => (c.id === id ? chapitre : c));
          return { ...state, [formationId]: next };
        });
      }),
      catchError((err: unknown) => throwError(() => err)),
    );
  }

  deleteChapitre(formationId: number, id: number): Observable<void> {
    return this.api.deleteChapitre(id).pipe(
      tap(() => {
        this._chapitresByFormation.update((state) => {
          const list = state[formationId] ?? [];
          return { ...state, [formationId]: list.filter((c) => c.id !== id) };
        });
      }),
      catchError((err: unknown) => throwError(() => err)),
    );
  }

  /**
   * Charge les chapitres d'une formation via les IRIs incluses dans la reponse subject.
   * Ne charge que les chapitres lies a cette formation.
   */
  loadChapitres(formationId: number, force = false): void {
    const currentStatus = this._chapitresStatus()[formationId];
    const alreadyLoaded = this._chapitresByFormation()[formationId] !== undefined;
    if (!force && (currentStatus === 'loading' || alreadyLoaded)) {
      return;
    }

    const formation = this._items().find((f) => f.id === formationId);
    const chapterIris = formation?.chapters ?? [];

    if (chapterIris.length === 0) {
      this._chapitresByFormation.update((state) => ({ ...state, [formationId]: [] }));
      this._chapitresStatus.update((state) => ({ ...state, [formationId]: 'idle' }));
      return;
    }

    this._chapitresStatus.update((state) => ({ ...state, [formationId]: 'loading' }));
    this._chapitresError.update((state) => {
      const { [formationId]: _removed, ...rest } = state;
      return rest;
    });

    this.api.getChapitresByIris(chapterIris).subscribe({
      next: (chapitres) => {
        const sorted = [...chapitres].sort((a, b) => a.sortOrder - b.sortOrder);
        this._chapitresByFormation.update((state) => ({ ...state, [formationId]: sorted }));
        this._chapitresStatus.update((state) => ({ ...state, [formationId]: 'idle' }));
      },
      error: (error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'Impossible de charger les chapitres.';
        this._chapitresStatus.update((state) => ({ ...state, [formationId]: 'error' }));
        this._chapitresError.update((state) => ({ ...state, [formationId]: message }));
      },
    });
  }
}
