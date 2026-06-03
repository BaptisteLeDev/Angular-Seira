import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '@environments/environment';
import { FormationApi } from './formation.api';

describe('FormationApi.listMine', () => {
  let api: FormationApi;
  let http: HttpTestingController;
  const base = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), FormationApi],
    });
    api = TestBed.inject(FormationApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('GET /me/subjects et renvoie available + locked', () => {
    let result: { available: { name: string }[]; locked: { name: string }[] } | undefined;
    api.listMine().subscribe((r) => (result = r));
    const req = http.expectOne(`${base}/me/subjects`);
    expect(req.request.method).toBe('GET');
    req.flush({
      available: [{ id: 1, name: 'Maths' }],
      locked: [{ id: 2, name: 'SEO' }],
    });
    expect(result?.available.map((s) => s.name)).toEqual(['Maths']);
    expect(result?.locked.map((s) => s.name)).toEqual(['SEO']);
  });
});
