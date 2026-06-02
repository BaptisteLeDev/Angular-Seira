jest.mock('@src/api/watch-session.api', () => ({
  WatchSessionApi: {
    requestToken: jest.fn(),
    heartbeat: jest.fn(),
  },
}));

import { WatchSessionApi } from '@src/api/watch-session.api';
import { useWatchSessionStore } from './watch-session.store';
import { useProgressStore } from './progress.store';

const api = WatchSessionApi as jest.Mocked<typeof WatchSessionApi>;

beforeEach(() => {
  jest.clearAllMocks();
  useWatchSessionStore.getState().resetAll();
  useProgressStore.setState({ byVideoId: {}, hydrated: false, inFlight: {} });
});

test('premier suivi -> requestToken au temps validé (baseline 0)', async () => {
  api.requestToken.mockResolvedValue({ token: 't1', segStart: 0, segEnd: 30, expiresAt: 'x' });
  await useWatchSessionStore.getState().track(7, 2, 120);
  expect(api.requestToken).toHaveBeenCalledWith(7, 0);
  expect(api.heartbeat).not.toHaveBeenCalled();
});

test('reprise : segment démarre au temps déjà certifié', async () => {
  useProgressStore.setState({
    byVideoId: { 7: { id: 1, watchedSeconds: 60, completionPercent: 50, status: 'in_progress' } },
  });
  api.requestToken.mockResolvedValue({ token: 't', segStart: 60, segEnd: 90, expiresAt: 'x' });
  await useWatchSessionStore.getState().track(7, 61, 120);
  expect(api.requestToken).toHaveBeenCalledWith(7, 60);
});

test('pas de heartbeat tant que la fin du segment n’est pas atteinte', async () => {
  api.requestToken.mockResolvedValue({ token: 't1', segStart: 0, segEnd: 30, expiresAt: 'x' });
  await useWatchSessionStore.getState().track(7, 5, 120);
  await useWatchSessionStore.getState().track(7, 20, 120);
  expect(api.heartbeat).not.toHaveBeenCalled();
});

test('segment atteint -> heartbeat, applique au progress store, puis redemande', async () => {
  api.requestToken
    .mockResolvedValueOnce({ token: 't1', segStart: 0, segEnd: 30, expiresAt: 'x' })
    .mockResolvedValueOnce({ token: 't2', segStart: 30, segEnd: 60, expiresAt: 'x' });
  api.heartbeat.mockResolvedValue({
    validatedSeconds: 30,
    segmentValidated: 30,
    completionPercent: 25,
    status: 'in_progress',
  });

  await useWatchSessionStore.getState().track(7, 5, 120); // token t1
  await useWatchSessionStore.getState().track(7, 31, 120); // heartbeat
  expect(api.heartbeat).toHaveBeenCalledWith('t1');
  expect(useProgressStore.getState().byVideoId[7]).toMatchObject({ watchedSeconds: 30 });

  await useWatchSessionStore.getState().track(7, 35, 120); // segment suivant
  expect(api.requestToken).toHaveBeenLastCalledWith(7, 30);
});

test('erreur réseau best-effort : ne jette pas et relâche', async () => {
  api.requestToken.mockRejectedValueOnce(new Error('net'));
  await expect(useWatchSessionStore.getState().track(7, 1, 120)).resolves.toBeUndefined();
  api.requestToken.mockResolvedValue({ token: 't1', segStart: 0, segEnd: 30, expiresAt: 'x' });
  await useWatchSessionStore.getState().track(7, 2, 120);
  expect(api.requestToken).toHaveBeenCalledTimes(2);
});
