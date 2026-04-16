import { OperatorFunction, map } from 'rxjs';
import { ZodType } from 'zod';
import { withEnvelope, withHydraCollection, unwrapEnvelope } from '../schemas/api-envelope.schema';

/**
 * Operateur RxJS qui valide la reponse avec un schema Zod,
 * accepte la forme nue ou enveloppee `{ data: ... }`, et
 * lance une erreur de validation typee si le schema echoue.
 */
export function parseResponse<T>(schema: ZodType<T>): OperatorFunction<unknown, T> {
  const envelopeSchema = withEnvelope(schema);
  return map((response) => {
    const parsed = envelopeSchema.parse(response);
    return unwrapEnvelope(parsed) as T;
  });
}

/**
 * Operateur RxJS pour les collections JSON-LD (Hydra).
 * Extrait le tableau `member` de la reponse.
 */
export function parseHydraCollection<T>(itemSchema: ZodType<T>): OperatorFunction<unknown, T[]> {
  const collectionSchema = withHydraCollection(itemSchema);
  return map((response) => {
    const parsed = collectionSchema.parse(response);
    return parsed.member;
  });
}
