import { ZodType } from 'zod';
import {
  withEnvelope,
  withHydraCollection,
  unwrapEnvelope,
} from '@src/schemas/api-envelope.schema';

export function parseResponse<T>(schema: ZodType<T>, raw: unknown): T {
  const envelopeSchema = withEnvelope(schema);
  const parsed = envelopeSchema.parse(raw);
  return unwrapEnvelope(parsed) as T;
}

export function parseHydraCollection<T>(itemSchema: ZodType<T>, raw: unknown): T[] {
  const collectionSchema = withHydraCollection(itemSchema);
  const parsed = collectionSchema.parse(raw);
  return parsed.member;
}
