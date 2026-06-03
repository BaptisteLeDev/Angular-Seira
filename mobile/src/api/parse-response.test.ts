import { z } from 'zod';
import { parseResponse } from './parse-response';

const Schema = z.object({ id: z.number(), data: z.string().optional() });

describe('parseResponse (enveloppe)', () => {
  test('objet nu : renvoyé tel quel', () => {
    expect(parseResponse(Schema, { id: 1 })).toEqual({ id: 1 });
  });
  test('enveloppe { data } : déballée', () => {
    expect(parseResponse(Schema, { data: { id: 2 } })).toEqual({ id: 2 });
  });
  test('objet ayant un champ data légitime : NON déballé à tort', () => {
    expect(parseResponse(Schema, { id: 3, data: 'x' })).toEqual({ id: 3, data: 'x' });
  });
});
