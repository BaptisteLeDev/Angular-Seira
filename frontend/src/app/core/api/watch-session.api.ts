import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  WatchTokenSchema,
  HeartbeatResultSchema,
  type WatchToken,
  type HeartbeatResult,
} from '../schemas/watch-session.schema';
import { parseResponse } from './parse-response';

/**
 * Flux anti-triche de visionnage certifié (clés temporelles).
 *
 * 1. `requestToken(videoId, segmentStart)` émet un token signé pour un segment
 *    (~30 s) AVANT de le regarder.
 * 2. `heartbeat(token)` crédite les secondes APRÈS visionnage complet du
 *    segment — le serveur valide la fenêtre temporelle et bloque tout replay.
 */
@Injectable({ providedIn: 'root' })
export class WatchSessionApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  requestToken(videoId: number, segmentStart: number): Observable<WatchToken> {
    return this.http
      .post<unknown>(`${this.apiUrl}/watch-sessions/request`, {
        video_id: videoId,
        segment_start: segmentStart,
      })
      .pipe(parseResponse(WatchTokenSchema));
  }

  heartbeat(token: string): Observable<HeartbeatResult> {
    return this.http
      .post<unknown>(`${this.apiUrl}/watch-sessions/heartbeat`, { token })
      .pipe(parseResponse(HeartbeatResultSchema));
  }
}
