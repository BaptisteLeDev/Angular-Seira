import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';
import { ProgressApi } from '../api/progress.api';
import { iriToId } from '../utils/iri';
import type { ProgressStatus, VideoProgressPayload, ChapterProgressPayload } from '../utils/video-progress';
import type { VideoProgress, ChapterProgress } from '../schemas/progress.schema';
import type { HeartbeatResult } from '../schemas/watch-session.schema';

interface VideoEntry {
  readonly id: number | null;
  readonly watchedSeconds: number;
  readonly completionPercent: number;
  readonly status: ProgressStatus;
}

interface ChapterEntry {
  readonly id: number | null;
  readonly completionPercent: number;
  readonly status: ProgressStatus;
}

/**
 * Store signal de la progression élève (vidéo + chapitre).
 *
 * Émission best-effort : un échec réseau / 401 / 422 ne bloque jamais la
 * lecture. L'upsert gère le cas où la ligne existe déjà côté serveur (409) en
 * relistant pour retrouver l'id, puis en faisant un PATCH.
 */
@Injectable({ providedIn: 'root' })
export class ProgressStore {
  private readonly api = inject(ProgressApi);

  private readonly _byVideoId = signal<Record<number, VideoEntry>>({});
  private readonly _byChapterId = signal<Record<number, ChapterEntry>>({});
  private readonly _hydrated = signal(false);

  readonly byVideoId = this._byVideoId.asReadonly();
  readonly byChapterId = this._byChapterId.asReadonly();
  readonly hydrated = this._hydrated.asReadonly();

  readonly videoEntries = computed(() => Object.values(this._byVideoId()));
  readonly chapterEntries = computed(() => Object.values(this._byChapterId()));

  // ── Hydratation ──────────────────────────────────────────────────────────
  hydrate(force = false): Promise<void> {
    if (!force && this._hydrated()) return Promise.resolve();

    const videos$ = this.api.listVideoProgress().pipe(catchError(() => of<VideoProgress[]>([])));
    const chapters$ = this.api.listChapterProgress().pipe(catchError(() => of<ChapterProgress[]>([])));

    return new Promise((resolve) => {
      videos$.subscribe((rows) => {
        const byVideoId: Record<number, VideoEntry> = {};
        for (const r of rows) {
          const vid = r.video ? iriToId(r.video) : r.videoId;
          if (!vid) continue;
          byVideoId[vid] = {
            id: r.id,
            watchedSeconds: r.watchedSecondsValidated ?? 0,
            completionPercent: r.completionPercent ?? 0,
            status: r.status ?? 'not_started',
          };
        }
        this._byVideoId.set(byVideoId);

        chapters$.subscribe((crows) => {
          const byChapterId: Record<number, ChapterEntry> = {};
          for (const r of crows) {
            const cid = r.chapter ? iriToId(r.chapter) : r.chapterId;
            if (!cid) continue;
            byChapterId[cid] = {
              id: r.id,
              completionPercent: r.completionPercent ?? 0,
              status: r.status ?? 'not_started',
            };
          }
          this._byChapterId.set(byChapterId);
          this._hydrated.set(true);
          resolve();
        });
      });
    });
  }

  // ── Émission vidéo ─────────────────────────────────────────────────────────
  reportVideo(videoId: number, payload: VideoProgressPayload): Observable<void> {
    const known = this._byVideoId()[videoId];
    const op$ =
      known?.id != null
        ? this.api.updateVideoProgress(known.id, payload)
        : this.api.createVideoProgress(videoId, payload).pipe(
            catchError((err) =>
              isConflict(err)
                ? this.api.listVideoProgress().pipe(
                    switchMap((rows) => {
                      const match = rows.find(
                        (r) => (r.video ? iriToId(r.video) : r.videoId) === videoId,
                      );
                      return match
                        ? this.api.updateVideoProgress(match.id, payload)
                        : throwError(() => err);
                    }),
                  )
                : throwError(() => err),
            ),
          );

    return op$.pipe(
      tap((saved) => {
        this._byVideoId.update((m) => ({
          ...m,
          [videoId]: {
            id: saved.id,
            watchedSeconds: payload.watchedSecondsValidated,
            completionPercent: payload.completionPercent,
            status: payload.status,
          },
        }));
      }),
      map(() => undefined),
      catchError(() => of(undefined)),
    );
  }

  // ── Émission chapitre ────────────────────────────────────────────────────────
  reportChapter(chapterId: number, payload: ChapterProgressPayload): Observable<void> {
    const known = this._byChapterId()[chapterId];
    const op$ =
      known?.id != null
        ? this.api.updateChapterProgress(known.id, payload)
        : this.api.createChapterProgress(chapterId, payload).pipe(
            catchError((err) =>
              isConflict(err)
                ? this.api.listChapterProgress().pipe(
                    switchMap((rows) => {
                      const match = rows.find(
                        (r) => (r.chapter ? iriToId(r.chapter) : r.chapterId) === chapterId,
                      );
                      return match
                        ? this.api.updateChapterProgress(match.id, payload)
                        : throwError(() => err);
                    }),
                  )
                : throwError(() => err),
            ),
          );

    return op$.pipe(
      tap((saved) => {
        this._byChapterId.update((m) => ({
          ...m,
          [chapterId]: {
            id: saved.id,
            completionPercent: payload.completionPercent,
            status: payload.status,
          },
        }));
      }),
      map(() => undefined),
      catchError(() => of(undefined)),
    );
  }

  /**
   * Applique le résultat d'un heartbeat de watch-session (temps certifié serveur)
   * à l'entrée vidéo locale, pour que les tableaux de bord reflètent l'autorité.
   */
  applyHeartbeat(videoId: number, result: HeartbeatResult): void {
    this._byVideoId.update((m) => ({
      ...m,
      [videoId]: {
        id: m[videoId]?.id ?? null,
        watchedSeconds: result.validatedSeconds,
        completionPercent: result.completionPercent,
        status: result.status,
      },
    }));
  }

  reset(): void {
    this._byVideoId.set({});
    this._byChapterId.set({});
    this._hydrated.set(false);
  }
}

function isConflict(err: unknown): boolean {
  return err instanceof HttpErrorResponse && err.status === 409;
}
