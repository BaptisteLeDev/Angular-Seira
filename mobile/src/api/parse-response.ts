import { ZodType } from 'zod';
import { withEnvelope, withHydraCollection } from '@src/schemas/api-envelope.schema';

export function parseResponse<T>(schema: ZodType<T>, raw: unknown): T {
  // withEnvelope déballe lui-même la branche `{ data }` via transform.
  return withEnvelope(schema).parse(raw) as T;
}

export function parseHydraCollection<T>(itemSchema: ZodType<T>, raw: unknown): T[] {
  const collectionSchema = withHydraCollection(itemSchema);
  const parsed = collectionSchema.parse(raw);
  return parsed.member;
}
