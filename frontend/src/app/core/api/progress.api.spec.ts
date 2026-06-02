import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '@environments/environment';
import { ProgressApi } from './progress.api';

describe('ProgressApi', () => {
  let api: ProgressApi;
  let http: HttpTestingController;
  const base = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ProgressApi],
    });
    api = TestBed.inject(ProgressApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listVideoProgress: GET et déballe une collection Hydra', () => {
    let result: unknown;
    api.listVideoProgress().subscribe((r) => (result = r));
    const req = http.expectOne(`${base}/video-progress`);
    expect(req.request.method).toBe('GET');
    req.flush({
      member: [
        { id: 1, video: '/api/videos/7', watchedSecondsValidated: 30, completionPercent: 50, status: 'in_progress' },
      ],
    });
    expect(result).toEqual([
      expect.objectContaining({ id: 1, completionPercent: 50, status: 'in_progress' }),
    ]);
  });

  it('listVideoProgress: tolère un tableau JSON nu (cas élève)', () => {
    let result: unknown[] = [];
    api.listVideoProgress().subscribe((r) => (result = r));
    http
      .expectOne(`${base}/video-progress`)
      .flush([{ id: 2, video: '/api/videos/8', completionPercent: 100, status: 'completed' }]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 2, status: 'completed' });
  });

  it('createVideoProgress: POST avec corps snake_case', () => {
    api
      .createVideoProgress(7, {
        watchedSecondsValidated: 30,
        completionPercent: 50,
        status: 'in_progress',
        lastSeenAt: '2026-06-02T10:00:00.000Z',
      })
      .subscribe();
    const req = http.expectOne(`${base}/video-progress`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      video_id: 7,
      completion_percent: 50,
      status: 'in_progress',
      last_seen_at: '2026-06-02T10:00:00.000Z',
    });
    req.flush({ id: 1, video: '/api/videos/7', completionPercent: 50, status: 'in_progress' });
  });

  it('updateVideoProgress: PATCH avec corps camelCase', () => {
    api
      .updateVideoProgress(1, {
        watchedSecondsValidated: 90,
        completionPercent: 96,
        status: 'completed',
        lastSeenAt: '2026-06-02T11:00:00.000Z',
      })
      .subscribe();
    const req = http.expectOne(`${base}/video-progress/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({
      completionPercent: 96,
      status: 'completed',
      lastSeenAt: '2026-06-02T11:00:00.000Z',
    });
    req.flush({ id: 1, video: '/api/videos/7', completionPercent: 96, status: 'completed' });
  });

  it('createChapterProgress: POST snake_case sans last_seen_at', () => {
    api
      .createChapterProgress(10, { chapterId: 10, completionPercent: 75, status: 'in_progress' })
      .subscribe();
    const req = http.expectOne(`${base}/chapter-progress`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      chapter_id: 10,
      completion_percent: 75,
      status: 'in_progress',
    });
    req.flush({ id: 5, chapter: '/api/chapters/10', completionPercent: 75, status: 'in_progress' });
  });

  it('updateChapterProgress: PATCH camelCase', () => {
    api
      .updateChapterProgress(5, { chapterId: 10, completionPercent: 100, status: 'completed' })
      .subscribe();
    const req = http.expectOne(`${base}/chapter-progress/5`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ completionPercent: 100, status: 'completed' });
    req.flush({ id: 5, chapter: '/api/chapters/10', completionPercent: 100, status: 'completed' });
  });
});
