import { z, type ZodType } from 'zod';

export function withEnvelope<T extends ZodType>(schema: T) {
  // L'objet nu correspond d'abord ; sinon seulement on déballe `{ data }`.
  // Le `transform` ne s'applique qu'à la branche enveloppe → aucun risque de
  // déballer à tort un objet qui possède lui-même un champ `data` légitime.
  return z.union([
    schema,
    z.object({ data: schema }).transform((o) => (o as { data: unknown }).data),
  ]);
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

