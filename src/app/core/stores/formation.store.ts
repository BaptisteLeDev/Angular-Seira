import { Injectable, computed, inject, signal } from '@angular/core';
import { FormationApi } from '../api/formation.api';
import type { Chapitre } from '../schemas/chapitre.schema';
import type { Formation } from '../schemas/formation.schema';

type Status = 'idle' | 'loading' | 'error';

@Injectable({ providedIn: 'root' })
export class FormationStore {
  private readonly api = inject(FormationApi);

  private readonly _items = signal<readonly Formation[]>([]);
  private readonly _status = signal<Status>('idle');
  private readonly _error = signal<string | null>(null);
  private readonly _chapitresByFormation = signal<Record<number, readonly Chapitre[]>>({});
  private readonly _chapitresStatus = signal<Record<number, Status>>({});
  private readonly _chapitresError = signal<Record<number, string>>({});

  readonly items = this._items.asReadonly();
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

  loadChapitres(formationId: number, force = false): void {
    const currentStatus = this._chapitresStatus()[formationId];
    const alreadyLoaded = this._chapitresByFormation()[formationId] !== undefined;
    if (!force && (currentStatus === 'loading' || alreadyLoaded)) {
      return;
    }

    this._chapitresStatus.update((state) => ({ ...state, [formationId]: 'loading' }));
    this._chapitresError.update((state) => {
      const { [formationId]: _removed, ...rest } = state;
      return rest;
    });

    this.api.getChapitres(formationId).subscribe({
      next: (chapitres) => {
        const scoped = chapitres
          .filter((chapitre) => chapitre.formation_id === formationId)
          .sort((a, b) => a.order - b.order);
        this._chapitresByFormation.update((state) => ({ ...state, [formationId]: scoped }));
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
