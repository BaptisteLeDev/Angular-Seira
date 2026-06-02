import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { z } from 'zod';
import { environment } from '@environments/environment';
import {
  VideoProgressSchema,
  ChapterProgressSchema,
  type VideoProgress,
  type ChapterProgress,
} from '../schemas/progress.schema';
import type {
  VideoProgressPayload,
  ChapterProgressPayload,
} from '../utils/video-progress';
import { parseResponse } from './parse-response';

/**
 * Émission et lecture de la progression élève (vidéo + chapitre).
 *
 * Les collections sont tolérantes : l'API peut renvoyer une enveloppe Hydra
 * `{ member: [...] }` ou, pour un élève filtré sur ses propres lignes, un
 * tableau JSON nu. POST envoie le DTO en snake_case ; PATCH cible le modèle en
 * camelCase (content-type merge-patch ajouté par l'intercepteur).
 */
@Injectable({ providedIn: 'root' })
export class ProgressApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // ── Video progress ─────────────────────────────────────────────────────────
  listVideoProgress(): Observable<VideoProgress[]> {
    return this.http
      .get<unknown>(`${this.apiUrl}/video-progress`)
      .pipe(map((raw) => parseCollection(raw, VideoProgressSchema)));
  }

  createVideoProgress(videoId: number, p: VideoProgressPayload): Observable<VideoProgress> {
    return this.http
      .post<unknown>(`${this.apiUrl}/video-progress`, {
        // watched_seconds_validated n'est plus accepté : le temps certifié
        // est exclusivement crédité via les watch-sessions (heartbeat).
        video_id: videoId,
        completion_percent: p.completionPercent,
        status: p.status,
        last_seen_at: p.lastSeenAt,
      })
      .pipe(parseResponse(VideoProgressSchema));
  }

  updateVideoProgress(id: number, p: VideoProgressPayload): Observable<VideoProgress> {
    return this.http
      .patch<unknown>(`${this.apiUrl}/video-progress/${id}`, {
        // watched_seconds_validated certifié via heartbeat uniquement.
        completionPercent: p.completionPercent,
        status: p.status,
        lastSeenAt: p.lastSeenAt,
      })
      .pipe(parseResponse(VideoProgressSchema));
  }

  // ── Chapter progress ─────────────────────────────────────────────────────────
  listChapterProgress(): Observable<ChapterProgress[]> {
    return this.http
      .get<unknown>(`${this.apiUrl}/chapter-progress`)
      .pipe(map((raw) => parseCollection(raw, ChapterProgressSchema)));
  }

  createChapterProgress(chapterId: number, p: ChapterProgressPayload): Observable<ChapterProgress> {
    return this.http
      .post<unknown>(`${this.apiUrl}/chapter-progress`, {
        chapter_id: chapterId,
        completion_percent: p.completionPercent,
        status: p.status,
      })
      .pipe(parseResponse(ChapterProgressSchema));
  }

  updateChapterProgress(id: number, p: ChapterProgressPayload): Observable<ChapterProgress> {
    return this.http
      .patch<unknown>(`${this.apiUrl}/chapter-progress/${id}`, {
        completionPercent: p.completionPercent,
        status: p.status,
      })
      .pipe(parseResponse(ChapterProgressSchema));
  }
}

/** Déballe une collection Hydra `{ member }` ou un tableau nu, puis valide. */
function parseCollection<T>(raw: unknown, schema: z.ZodType<T>): T[] {
  const arr = Array.isArray(raw) ? raw : ((raw as { member?: unknown[] })?.member ?? []);
  return z.array(schema).parse(arr);
}
