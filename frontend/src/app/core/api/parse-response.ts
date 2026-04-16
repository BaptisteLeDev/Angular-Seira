import { MonoTypeOperatorFunction, OperatorFunction, map } from 'rxjs';
import { ZodType } from 'zod';
import { unwrapEnvelope, withEnvelope } from '../schemas/api-envelope.schema';

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

/** Variante pour les reponses sans data (e.g. logout qui renvoie `{ message }`). */
export function parseMessageOnly(): MonoTypeOperatorFunction<unknown> {
  return map((response) => response);
}
