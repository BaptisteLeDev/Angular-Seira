import { HttpError } from '@src/api/client';

jest.mock('@src/api/video-progress.api', () => ({
  VideoProgressApi: {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

import { VideoProgressApi } from '@src/api/video-progress.api';
import { useProgressStore } from './progress.store';

const api = VideoProgressApi as jest.Mocked<typeof VideoProgressApi>;

const payload = {
  watchedSecondsValidated: 60,
  completionPercent: 50,
  status: 'in_progress' as const,
  lastSeenAt: '2026-06-01T00:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  useProgressStore.setState({ byVideoId: {}, hydrated: false, inFlight: {} });
});

test('hydrate mappe IRI video -> byVideoId', async () => {
  api.list.mockResolvedValue([
    { id: 7, video: '/api/videos/3', watchedSecondsValidated: 120, completionPercent: 35, status: 'in_progress' } as any,
  ]);
  await useProgressStore.getState().hydrate();
  expect(useProgressStore.getState().byVideoId[3]).toMatchObject({ id: 7, completionPercent: 35 });
});

test('report sans id -> POST', async () => {
  api.create.mockResolvedValue({ id: 9, video: '/api/videos/3', ...payload } as any);
  await useProgressStore.getState().report(3, payload);
  expect(api.create).toHaveBeenCalledWith(3, payload);
  expect(useProgressStore.getState().byVideoId[3].id).toBe(9);
});

test('report avec id connu -> PATCH', async () => {
  useProgressStore.setState({ byVideoId: { 3: { id: 9, watchedSeconds: 10, completionPercent: 10, status: 'in_progress' } } });
  api.update.mockResolvedValue({ id: 9, video: '/api/videos/3', ...payload } as any);
  await useProgressStore.getState().report(3, payload);
  expect(api.update).toHaveBeenCalledWith(9, payload);
  expect(api.create).not.toHaveBeenCalled();
});

test('POST 409 -> list -> resolve id -> PATCH', async () => {
  api.create.mockRejectedValue(new HttpError(409, null, 'conflit'));
  api.list.mockResolvedValue([{ id: 42, video: '/api/videos/3', watchedSecondsValidated: 5, completionPercent: 5, status: 'in_progress' } as any]);
  api.update.mockResolvedValue({ id: 42, video: '/api/videos/3', ...payload } as any);
  await useProgressStore.getState().report(3, payload);
  expect(api.update).toHaveBeenCalledWith(42, payload);
});

test('in-flight: pas d\'envoi concurrent pour le meme videoId', async () => {
  useProgressStore.setState({ inFlight: { 3: true } });
  await useProgressStore.getState().report(3, payload);
  expect(api.create).not.toHaveBeenCalled();
  expect(api.update).not.toHaveBeenCalled();
});

test('erreur reseau n\'jette pas et libere le in-flight', async () => {
  api.create.mockRejectedValue(new HttpError(0, null, 'reseau'));
  await expect(useProgressStore.getState().report(3, payload)).resolves.toBeUndefined();
  expect(useProgressStore.getState().inFlight[3]).toBeFalsy();
});
