import { TestBed } from '@angular/core/testing';
import { Router, type ActivatedRouteSnapshot, type RouterStateSnapshot } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authGuard } from './auth.guard';
import { roleGuard } from './role.guard';
import { AuthStore } from '../stores/auth.store';

const URL_TREE = Symbol('urlTree');
const stateStub = {} as RouterStateSnapshot;

function configure(auth: Record<string, unknown>) {
  const createUrlTree = vi.fn(() => URL_TREE);
  TestBed.configureTestingModule({
    providers: [
      { provide: AuthStore, useValue: auth },
      { provide: Router, useValue: { createUrlTree, navigateByUrl: vi.fn() } },
    ],
  });
  return { createUrlTree };
}

function routeWith(roles?: string[]): ActivatedRouteSnapshot {
  return { data: roles ? { roles } : {} } as unknown as ActivatedRouteSnapshot;
}

describe('authGuard', () => {
  it('laisse passer un utilisateur authentifié', () => {
    configure({ isAuthenticated: () => true, clearSession: vi.fn() });
    const r = TestBed.runInInjectionContext(() => authGuard(routeWith(), stateStub));
    expect(r).toBe(true);
  });

  it('non authentifié -> clearSession + redirection /login', () => {
    const clearSession = vi.fn();
    const { createUrlTree } = configure({ isAuthenticated: () => false, clearSession });
    const r = TestBed.runInInjectionContext(() => authGuard(routeWith(), stateStub));
    expect(clearSession).toHaveBeenCalledOnce();
    expect(createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(r).toBe(URL_TREE);
  });
});

describe('roleGuard', () => {
  it('aucune restriction de rôle -> accès libre', () => {
    configure({ hasAnyRole: () => false });
    const r = TestBed.runInInjectionContext(() => roleGuard(routeWith(), stateStub));
    expect(r).toBe(true);
  });

  it('rôle requis présent -> passe', () => {
    configure({ hasAnyRole: () => true });
    const r = TestBed.runInInjectionContext(() => roleGuard(routeWith(['admin']), stateStub));
    expect(r).toBe(true);
  });

  it('rôle requis absent -> redirection /unauthorized', () => {
    const { createUrlTree } = configure({ hasAnyRole: () => false });
    const r = TestBed.runInInjectionContext(() => roleGuard(routeWith(['admin']), stateStub));
    expect(createUrlTree).toHaveBeenCalledWith(['/unauthorized']);
    expect(r).toBe(URL_TREE);
  });
});
