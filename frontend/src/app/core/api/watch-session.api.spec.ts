import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '@environments/environment';
import { WatchSessionApi } from './watch-session.api';

describe('WatchSessionApi', () => {
  let api: WatchSessionApi;
  let http: HttpTestingController;
  const base = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), WatchSessionApi],
    });
    api = TestBed.inject(WatchSessionApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requestToken: POST /watch-sessions/request avec video_id + segment_start, mappe en camelCase', () => {
    let result: unknown;
    api.requestToken(7, 30).subscribe((r) => (result = r));
    const req = http.expectOne(`${base}/watch-sessions/request`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ video_id: 7, segment_start: 30 });
    req.flush({ token: 'abc.def', seg_start: 30, seg_end: 60, expires_at: '2026-06-02T10:00:00+00:00' });
    expect(result).toEqual({ token: 'abc.def', segStart: 30, segEnd: 60, expiresAt: '2026-06-02T10:00:00+00:00' });
  });

  it('heartbeat: POST /watch-sessions/heartbeat avec token, mappe la réponse', () => {
    let result: unknown;
    api.heartbeat('abc.def').subscribe((r) => (result = r));
    const req = http.expectOne(`${base}/watch-sessions/heartbeat`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ token: 'abc.def' });
    req.flush({
      validated_seconds: 60,
      segment_validated: 30,
      completion_percent: 50,
      status: 'in_progress',
    });
    expect(result).toEqual({
      validatedSeconds: 60,
      segmentValidated: 30,
      completionPercent: 50,
      status: 'in_progress',
    });
  });
});
