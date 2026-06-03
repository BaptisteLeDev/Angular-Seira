import { z } from 'zod';

const mockApiRequest = jest.fn();
jest.mock('./client', () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

import { fetchHydraAll } from './pagination';

const Item = z.object({ id: z.number() });

const range = (start: number, count: number) =>
  Array.from({ length: count }, (_, i) => ({ id: start + i }));

describe('fetchHydraAll (auto-walk pagination Hydra)', () => {
  beforeEach(() => mockApiRequest.mockReset());

  test('une seule page : renvoie member et fait un seul appel', async () => {
    mockApiRequest.mockResolvedValueOnce({ member: range(1, 2), totalItems: 2 });

    const items = await fetchHydraAll('/subjects', Item);

    expect(items).toEqual([{ id: 1 }, { id: 2 }]);
    expect(mockApiRequest).toHaveBeenCalledTimes(1);
    expect(mockApiRequest).toHaveBeenCalledWith('/subjects?page=1');
  });

  test('plusieurs pages : concatène jusqu’à totalItems', async () => {
    mockApiRequest
      .mockResolvedValueOnce({ member: range(1, 30), totalItems: 45 })
      .mockResolvedValueOnce({ member: range(31, 15), totalItems: 45 });

    const items = await fetchHydraAll('/subjects', Item);

    expect(items).toHaveLength(45);
    expect(items[44]).toEqual({ id: 45 });
    expect(mockApiRequest).toHaveBeenCalledTimes(2);
    expect(mockApiRequest).toHaveBeenNthCalledWith(1, '/subjects?page=1');
    expect(mockApiRequest).toHaveBeenNthCalledWith(2, '/subjects?page=2');
  });

  test('préserve les query params existants (séparateur &)', async () => {
    mockApiRequest.mockResolvedValueOnce({ member: range(1, 1), totalItems: 1 });

    await fetchHydraAll('/users?role=student', Item);

    expect(mockApiRequest).toHaveBeenCalledWith('/users?role=student&page=1');
  });

  test('totalItems absent : ne tente pas de page suivante', async () => {
    mockApiRequest.mockResolvedValueOnce({ member: range(1, 1) });

    const items = await fetchHydraAll('/schools', Item);

    expect(items).toEqual([{ id: 1 }]);
    expect(mockApiRequest).toHaveBeenCalledTimes(1);
  });

  test('page vide inattendue : s’arrête sans boucle infinie', async () => {
    mockApiRequest
      .mockResolvedValueOnce({ member: range(1, 30), totalItems: 999 })
      .mockResolvedValueOnce({ member: [], totalItems: 999 });

    const items = await fetchHydraAll('/subjects', Item);

    expect(items).toHaveLength(30);
    expect(mockApiRequest).toHaveBeenCalledTimes(2);
  });
});
