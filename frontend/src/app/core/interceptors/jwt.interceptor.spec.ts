import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '@environments/environment';
import { jwtInterceptor } from './jwt.interceptor';
import { AuthStore } from '../stores/auth.store';

function setup(token: string | null) {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([jwtInterceptor])),
      provideHttpClientTesting(),
      { provide: AuthStore, useValue: { getToken: () => token } },
    ],
  });
  return { http: TestBed.inject(HttpClient), ctrl: TestBed.inject(HttpTestingController) };
}

describe('jwtInterceptor', () => {
  let ctrl: HttpTestingController;
  afterEach(() => ctrl?.verify());

  it('ajoute le Bearer quand un token est présent', () => {
    const s = setup('tok123');
    ctrl = s.ctrl;
    s.http.get(`${environment.apiUrl}/users`).subscribe();
    const req = ctrl.expectOne(`${environment.apiUrl}/users`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok123');
    req.flush({});
  });

  it("n'ajoute pas de Bearer sur /auth/login", () => {
    const s = setup('tok123');
    ctrl = s.ctrl;
    s.http.post(`${environment.apiUrl}/auth/login`, {}).subscribe();
    const req = ctrl.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it("n'ajoute pas de Bearer sans token", () => {
    const s = setup(null);
    ctrl = s.ctrl;
    s.http.get(`${environment.apiUrl}/users`).subscribe();
    const req = ctrl.expectOne(`${environment.apiUrl}/users`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
