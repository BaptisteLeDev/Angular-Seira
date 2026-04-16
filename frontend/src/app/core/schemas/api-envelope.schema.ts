import { z, type ZodType } from 'zod';

/**
 * Le backend Laravel peut renvoyer soit la donnee brute,
 * soit un enveloppe `{ data: ... }`. On accepte les deux.
 */
export function withEnvelope<T extends ZodType>(schema: T) {
  return z.union([schema, z.object({ data: schema })]);
}

export function unwrapEnvelope<T>(payload: T | { data: T }): T {
  return isEnvelope<T>(payload) ? payload.data : payload;
}

function isEnvelope<T>(value: unknown): value is { data: T } {
  return typeof value === 'object' && value !== null && 'data' in value;
}
