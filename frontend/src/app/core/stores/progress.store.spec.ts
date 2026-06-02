import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { of, throwError, firstValueFrom } from 'rxjs';
import { ProgressStore } from './progress.store';
import { ProgressApi } from '../api/progress.api';
import type { VideoProgressPayload } from '../utils/video-progress';

const payload: VideoProgressPayload = {
  watchedSecondsValidated: 30,
  completionPercent: 50,
  status: 'in_progress',
  lastSeenAt: '2026-06-02T10:00:00.000Z',
};

function makeApi() {
  return {
    listVideoProgress: vi.fn(),
    createVideoProgress: vi.fn(),
    updateVideoProgress: vi.fn(),
    listChapterProgress: vi.fn(),
    createChapterProgress: vi.fn(),
    updateChapterProgress: vi.fn(),
  };
}

function setup(api: ReturnType<typeof makeApi>) {
  TestBed.configureTestingModule({
    providers: [ProgressStore, { provide: ProgressApi, useValue: api }],
  });
  return TestBed.inject(ProgressStore);
}

describe('ProgressStore.reportVideo', () => {
  let api: ReturnType<typeof makeApi>;
  let store: ProgressStore;

  beforeEach(() => {
    api = makeApi();
    store = setup(api);
  });

  it('vidéo inconnue -> POST puis mémorise id + valeurs', async () => {
    api.createVideoProgress.mockReturnValue(
      of({ id: 99, video: '/api/videos/7', completionPercent: 50, status: 'in_progress' }),
    );
    await firstValueFrom(store.reportVideo(7, payload));

    expect(api.createVideoProgress).toHaveBeenCalledWith(7, payload);
    expect(api.updateVideoProgress).not.toHaveBeenCalled();
    expect(store.byVideoId()[7]).toMatchObject({ id: 99, completionPercent: 50, status: 'in_progress' });
  });

  it('vidéo connue -> PATCH (pas de POST)', async () => {
    api.createVideoProgress.mockReturnValue(
      of({ id: 99, video: '/api/videos/7', completionPercent: 50, status: 'in_progress' }),
    );
    await firstValueFrom(store.reportVideo(7, payload));
    api.updateVideoProgress.mockReturnValue(
      of({ id: 99, video: '/api/videos/7', completionPercent: 80, status: 'in_progress' }),
    );

    await firstValueFrom(store.reportVideo(7, { ...payload, completionPercent: 80 }));

    expect(api.updateVideoProgress).toHaveBeenCalledWith(99, expect.objectContaining({ completionPercent: 80 }));
    expect(api.createVideoProgress).toHaveBeenCalledTimes(1);
    expect(store.byVideoId()[7]).toMatchObject({ id: 99, completionPercent: 80 });
  });

  it('POST 409 -> liste, retrouve la ligne, PATCH', async () => {
    api.createVideoProgress.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409 })),
    );
    api.listVideoProgress.mockReturnValue(
      of([{ id: 42, video: '/api/videos/7', completionPercent: 10, status: 'in_progress' }]),
    );
    api.updateVideoProgress.mockReturnValue(
      of({ id: 42, video: '/api/videos/7', completionPercent: 50, status: 'in_progress' }),
    );

    await firstValueFrom(store.reportVideo(7, payload));

    expect(api.updateVideoProgress).toHaveBeenCalledWith(42, payload);
    expect(store.byVideoId()[7]).toMatchObject({ id: 42, completionPercent: 50 });
  });

  it('best-effort : une erreur serveur ne propage pas', async () => {
    api.createVideoProgress.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
    await expect(firstValueFrom(store.reportVideo(7, payload))).resolves.toBeUndefined();
  });
});

describe('ProgressStore.reportChapter', () => {
  let api: ReturnType<typeof makeApi>;
  let store: ProgressStore;

  beforeEach(() => {
    api = makeApi();
    store = setup(api);
  });

  it('chapitre inconnu -> POST puis mémorise', async () => {
    api.createChapterProgress.mockReturnValue(
      of({ id: 5, chapter: '/api/chapters/10', completionPercent: 75, status: 'in_progress' }),
    );
    await firstValueFrom(
      store.reportChapter(10, { chapterId: 10, completionPercent: 75, status: 'in_progress' }),
    );

    expect(api.createChapterProgress).toHaveBeenCalledWith(10, expect.objectContaining({ completionPercent: 75 }));
    expect(store.byChapterId()[10]).toMatchObject({ id: 5, completionPercent: 75, status: 'in_progress' });
  });
});

describe('ProgressStore.hydrate', () => {
  it('charge vidéos + chapitres et indexe par id', async () => {
    const api = makeApi();
    api.listVideoProgress.mockReturnValue(
      of([{ id: 1, video: '/api/videos/7', completionPercent: 50, status: 'in_progress' }]),
    );
    api.listChapterProgress.mockReturnValue(
      of([{ id: 2, chapter: '/api/chapters/10', completionPercent: 100, status: 'completed' }]),
    );
    const store = setup(api);

    await store.hydrate();

    expect(store.byVideoId()[7]).toMatchObject({ id: 1, completionPercent: 50 });
    expect(store.byChapterId()[10]).toMatchObject({ id: 2, status: 'completed' });
    expect(store.hydrated()).toBe(true);
  });

  it('erreur réseau -> hydrated tout de même (best-effort)', async () => {
    const api = makeApi();
    api.listVideoProgress.mockReturnValue(throwError(() => new Error('net')));
    api.listChapterProgress.mockReturnValue(of([]));
    const store = setup(api);

    await store.hydrate();
    expect(store.hydrated()).toBe(true);
  });
});
