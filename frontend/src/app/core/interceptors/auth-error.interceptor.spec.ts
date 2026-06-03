import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { environment } from '@environments/environment';
import { authErrorInterceptor } from './auth-error.interceptor';
import { AuthStore } from '../stores/auth.store';

describe('authErrorInterceptor', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;
  const clearSession = vi.fn();
  const navigateByUrl = vi.fn();

  beforeEach(() => {
    clearSession.mockClear();
    navigateByUrl.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthStore, useValue: { clearSession } },
        { provide: Router, useValue: { navigateByUrl } },
      ],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
  });
  afterEach(() => ctrl.verify());

  it('401 -> clearSession + redirection /login', () => {
    http.get(`${environment.apiUrl}/users`).subscribe({ error: () => {} });
    ctrl.expectOne(`${environment.apiUrl}/users`).flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(clearSession).toHaveBeenCalledOnce();
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('autre erreur (500) -> pas de déconnexion', () => {
    http.get(`${environment.apiUrl}/users`).subscribe({ error: () => {} });
    ctrl.expectOne(`${environment.apiUrl}/users`).flush(null, { status: 500, statusText: 'Server Error' });
    expect(clearSession).not.toHaveBeenCalled();
    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});
