import { z, type ZodType } from 'zod';

export function withEnvelope<T extends ZodType>(schema: T) {
  return z.union([schema, z.object({ data: schema })]);
}

export function withHydraCollection<T extends ZodType>(itemSchema: T) {
  return z.object({
    member: z.array(itemSchema),
    totalItems: z.number().optional(),
    '@context': z.string().optional(),
    '@id': z.string().optional(),
    '@type': z.string().optional(),
  });
}

export function unwrapEnvelope<T>(payload: T | { data: T }): T {
  return isEnvelope<T>(payload) ? payload.data : payload;
}

function isEnvelope<T>(value: unknown): value is { data: T } {
  return typeof value === 'object' && value !== null && 'data' in value;
}
