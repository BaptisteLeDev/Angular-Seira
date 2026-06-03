import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { WatchSessionService } from './watch-session.service';
import { WatchSessionApi } from '../api/watch-session.api';
import { ProgressStore } from './progress.store';

function makeApi() {
  return {
    requestToken: vi.fn(),
    heartbeat: vi.fn(),
  };
}

function makeProgress(baseline: Record<number, { watchedSeconds: number }> = {}) {
  return {
    byVideoId: () => baseline,
    applyHeartbeat: vi.fn(),
  };
}

function setup(api: ReturnType<typeof makeApi>, progress: ReturnType<typeof makeProgress>) {
  TestBed.configureTestingModule({
    providers: [
      WatchSessionService,
      { provide: WatchSessionApi, useValue: api },
      { provide: ProgressStore, useValue: progress },
    ],
  });
  return TestBed.inject(WatchSessionService);
}

describe('WatchSessionService', () => {
  let api: ReturnType<typeof makeApi>;

  beforeEach(() => {
    api = makeApi();
  });

  it('premier suivi -> demande un token pour le segment courant (baseline 0)', () => {
    api.requestToken.mockReturnValue(of({ token: 't1', segStart: 0, segEnd: 30, expiresAt: 'x' }));
    const svc = setup(api, makeProgress());

    svc.track(7, 2, 120);

    expect(api.requestToken).toHaveBeenCalledWith(7, 0);
    expect(api.heartbeat).not.toHaveBeenCalled();
  });

  it('démarre le segment au temps déjà certifié (reprise)', () => {
    api.requestToken.mockReturnValue(of({ token: 't', segStart: 60, segEnd: 90, expiresAt: 'x' }));
    const svc = setup(api, makeProgress({ 7: { watchedSeconds: 60 } }));

    svc.track(7, 61, 120);

    expect(api.requestToken).toHaveBeenCalledWith(7, 60);
  });

  it('ne heartbeat pas tant que le segment n’est pas atteint', () => {
    api.requestToken.mockReturnValue(of({ token: 't1', segStart: 0, segEnd: 30, expiresAt: 'x' }));
    const svc = setup(api, makeProgress());

    svc.track(7, 5, 120); // récupère le token
    svc.track(7, 20, 120); // cap < segEnd

    expect(api.heartbeat).not.toHaveBeenCalled();
  });

  it('segment atteint -> heartbeat, crédite, applique au store, puis redemande', () => {
    api.requestToken
      .mockReturnValueOnce(of({ token: 't1', segStart: 0, segEnd: 30, expiresAt: 'x' }))
      .mockReturnValueOnce(of({ token: 't2', segStart: 30, segEnd: 60, expiresAt: 'x' }));
    api.heartbeat.mockReturnValue(
      of({ validatedSeconds: 30, segmentValidated: 30, completionPercent: 25, status: 'in_progress' }),
    );
    const progress = makeProgress();
    const svc = setup(api, progress);

    svc.track(7, 5, 120); // token t1
    svc.track(7, 31, 120); // cap >= segEnd -> heartbeat
    expect(api.heartbeat).toHaveBeenCalledWith('t1');
    expect(progress.applyHeartbeat).toHaveBeenCalledWith(7, expect.objectContaining({ validatedSeconds: 30 }));

    svc.track(7, 35, 120); // segment suivant
    expect(api.requestToken).toHaveBeenLastCalledWith(7, 30);
  });

  it('un seul appel en vol à la fois (pas de double request)', () => {
    api.requestToken.mockReturnValue(of({ token: 't1', segStart: 0, segEnd: 30, expiresAt: 'x' }));
    const svc = setup(api, makeProgress());

    svc.track(7, 1, 120);
    svc.track(7, 2, 120); // token déjà présent -> pas de nouvelle requête
    expect(api.requestToken).toHaveBeenCalledTimes(1);
  });

  it('erreur réseau best-effort : ne jette pas, réessaiera', () => {
    api.requestToken.mockReturnValue(throwError(() => new Error('net')));
    const svc = setup(api, makeProgress());

    expect(() => svc.track(7, 1, 120)).not.toThrow();
    // l'état inFlight est relâché -> un nouveau track peut redemander
    api.requestToken.mockReturnValue(of({ token: 't1', segStart: 0, segEnd: 30, expiresAt: 'x' }));
    svc.track(7, 2, 120);
    expect(api.requestToken).toHaveBeenCalledTimes(2);
  });
});
