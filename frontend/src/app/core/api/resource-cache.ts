import { Injectable } from '@angular/core';
import { Observable, catchError, shareReplay, throwError } from 'rxjs';

/**
 * Cache HTTP en mémoire avec déduplication des requêtes en vol.
 *
 * Le backend n'expose ni endpoint batch ni filtre `id[]` : charger N ressources
 * par IRI reste N requêtes au premier accès à froid. Ce cache évite tout le reste :
 * - **déduplication** — plusieurs `get()` simultanés sur la même clé partagent un
 *   unique appel HTTP (via `shareReplay`) ;
 * - **mémoïsation** — dans la fenêtre TTL, un `get()` ressert le résultat sans
 *   refaire la requête (navigations aller-retour, IRIs référencés plusieurs fois).
 *
 * Les erreurs ne sont **jamais** mises en cache : une entrée qui échoue est évincée
 * pour qu'un prochain `get()` retente. Les mutations doivent appeler `invalidate()`.
 */
@Injectable({ providedIn: 'root' })
export class ResourceCache {
  private static readonly DEFAULT_TTL_MS = 5 * 60 * 1000;

  private readonly entries = new Map<string, { at: number; obs: Observable<unknown> }>();

  get<T>(key: string, factory: () => Observable<T>, ttlMs = ResourceCache.DEFAULT_TTL_MS): Observable<T> {
    const now = Date.now();
    const hit = this.entries.get(key);
    if (hit && now - hit.at < ttlMs) {
      return hit.obs as Observable<T>;
    }

    const shared = factory().pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError((err: unknown) => {
        // On n'empoisonne pas le cache avec une erreur : on évince et on propage.
        this.entries.delete(key);
        return throwError(() => err);
      }),
    );
    this.entries.set(key, { at: now, obs: shared });
    return shared as Observable<T>;
  }

  invalidate(key: string): void {
    this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }
}
