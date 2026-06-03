import { describe, it, expect, beforeEach } from 'vitest';
import { Observable, of } from 'rxjs';
import { ResourceCache } from './resource-cache';

describe('ResourceCache', () => {
  let cache: ResourceCache;

  beforeEach(() => {
    cache = new ResourceCache();
  });

  it('déduplique : la factory n’est appelée qu’une fois pour la même clé', () => {
    let calls = 0;
    const factory = () => {
      calls++;
      return of('valeur');
    };

    let a: string | undefined;
    let b: string | undefined;
    cache.get('k', factory).subscribe((v) => (a = v));
    cache.get('k', factory).subscribe((v) => (b = v));

    expect(calls).toBe(1);
    expect(a).toBe('valeur');
    expect(b).toBe('valeur');
  });

  it('clés différentes : deux appels distincts', () => {
    let calls = 0;
    const factory = () => {
      calls++;
      return of(calls);
    };

    cache.get('a', factory).subscribe();
    cache.get('b', factory).subscribe();

    expect(calls).toBe(2);
  });

  it('ne met pas en cache les erreurs : la factory est rappelée après un échec', () => {
    let calls = 0;
    const factory = () =>
      new Observable<string>((sub) => {
        calls++;
        sub.error(new Error('boom'));
      });

    cache.get('k', factory).subscribe({ error: () => undefined });
    cache.get('k', factory).subscribe({ error: () => undefined });

    expect(calls).toBe(2);
  });

  it('invalidate(clé) force un nouvel appel de la factory', () => {
    let calls = 0;
    const factory = () => {
      calls++;
      return of('v');
    };

    cache.get('k', factory).subscribe();
    cache.invalidate('k');
    cache.get('k', factory).subscribe();

    expect(calls).toBe(2);
  });

  it('clear() vide tout le cache', () => {
    let calls = 0;
    const factory = () => {
      calls++;
      return of('v');
    };

    cache.get('k', factory).subscribe();
    cache.clear();
    cache.get('k', factory).subscribe();

    expect(calls).toBe(2);
  });
});
