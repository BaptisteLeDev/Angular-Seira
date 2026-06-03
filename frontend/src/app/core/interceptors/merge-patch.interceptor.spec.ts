import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '@environments/environment';
import { mergePatchInterceptor } from './merge-patch.interceptor';

describe('mergePatchInterceptor', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([mergePatchInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
  });
  afterEach(() => ctrl.verify());

  it('force application/merge-patch+json sur PATCH', () => {
    http.patch(`${environment.apiUrl}/x/1`, { a: 1 }).subscribe();
    const req = ctrl.expectOne(`${environment.apiUrl}/x/1`);
    expect(req.request.headers.get('Content-Type')).toBe('application/merge-patch+json');
    req.flush({});
  });

  it('ne touche pas les autres méthodes', () => {
    http.post(`${environment.apiUrl}/x`, { a: 1 }).subscribe();
    const req = ctrl.expectOne(`${environment.apiUrl}/x`);
    expect(req.request.headers.get('Content-Type')).not.toBe('application/merge-patch+json');
    req.flush({});
  });
});
