import { Injectable, computed, inject, signal } from '@angular/core';
import { ArticleApi } from '../api/article.api';
import type { Article } from '../schemas/article.schema';

type Status = 'idle' | 'loading' | 'error';

@Injectable({ providedIn: 'root' })
export class ArticleStore {
  private readonly api = inject(ArticleApi);

  private readonly _byChapitre = signal<Record<number, readonly Article[]>>({});
  private readonly _status = signal<Record<number, Status>>({});
  private readonly _error = signal<Record<number, string>>({});

  readonly byChapitre = (chapitreId: number) =>
    computed(() => this._byChapitre()[chapitreId] ?? []);

  readonly statusOf = (chapitreId: number) => computed(() => this._status()[chapitreId] ?? 'idle');

  readonly errorOf = (chapitreId: number) => computed(() => this._error()[chapitreId] ?? null);

  /**
   * Charge les contenus d'un chapitre via les IRIs incluses dans la reponse chapter.
   */
  loadByChapitre(chapitreId: number, contentIris: string[], force = false): void {
    const currentStatus = this._status()[chapitreId];
    const alreadyLoaded = this._byChapitre()[chapitreId] !== undefined;
    if (!force && (currentStatus === 'loading' || alreadyLoaded)) {
      return;
    }

    if (contentIris.length === 0) {
      this._byChapitre.update((state) => ({ ...state, [chapitreId]: [] }));
      this._status.update((state) => ({ ...state, [chapitreId]: 'idle' }));
      return;
    }

    this._status.update((state) => ({ ...state, [chapitreId]: 'loading' }));
    this._error.update((state) => {
      const { [chapitreId]: _removed, ...rest } = state;
      return rest;
    });

    this.api.listByIris(contentIris).subscribe({
      next: (articles) => {
        const sorted = [...articles].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        this._byChapitre.update((state) => ({ ...state, [chapitreId]: sorted }));
        this._status.update((state) => ({ ...state, [chapitreId]: 'idle' }));
      },
      error: (error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'Impossible de charger les contenus.';
        this._status.update((state) => ({ ...state, [chapitreId]: 'error' }));
        this._error.update((state) => ({ ...state, [chapitreId]: message }));
      },
    });
  }

  reset(chapitreId?: number): void {
    if (chapitreId === undefined) {
      this._byChapitre.set({});
      this._status.set({});
      this._error.set({});
      return;
    }
    this._byChapitre.update((state) => {
      const { [chapitreId]: _removed, ...rest } = state;
      return rest;
    });
    this._status.update((state) => {
      const { [chapitreId]: _removed, ...rest } = state;
      return rest;
    });
    this._error.update((state) => {
      const { [chapitreId]: _removed, ...rest } = state;
      return rest;
    });
  }
}
