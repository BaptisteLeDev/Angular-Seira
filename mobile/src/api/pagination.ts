import type { ZodType } from 'zod';
import { apiRequest } from './client';
import { withHydraCollection } from '@src/schemas/api-envelope.schema';

/** Garde-fou anti-boucle si le backend renvoie un `totalItems` incohérent. */
const MAX_PAGES = 100;

/**
 * Charge l'intégralité d'une collection Hydra paginée.
 *
 * Le backend API Platform plafonne les collections à 30 items/page et n'autorise
 * pas la pagination côté client : la seule façon d'obtenir une liste complète est
 * de suivre les pages (`?page=N`) jusqu'à atteindre `totalItems`.
 *
 * - S'arrête dès que tous les items annoncés par `totalItems` sont chargés.
 * - Si `totalItems` est absent (réponse non paginée), s'arrête après la 1ʳᵉ page.
 * - Garde-fous : page vide inattendue ou dépassement de `MAX_PAGES`.
 */
export async function fetchHydraAll<T>(path: string, itemSchema: ZodType<T>): Promise<T[]> {
  const schema = withHydraCollection(itemSchema);
  const separator = path.includes('?') ? '&' : '?';
  const items: T[] = [];
  let page = 1;
  let total = Infinity;

  while (items.length < total && page <= MAX_PAGES) {
    const raw = await apiRequest<unknown>(`${path}${separator}page=${page}`);
    const parsed = schema.parse(raw);
    items.push(...parsed.member);

    if (parsed.totalItems == null) break; // réponse non paginée
    total = parsed.totalItems;
    if (parsed.member.length === 0) break; // garde-fou : évite la boucle infinie
    page += 1;
  }

  return items;
}
