function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function readPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function fuzzyFilter<T>(
  items: readonly T[],
  keys: readonly string[],
  query: string,
): readonly T[] {
  const q = normalize(query.trim());
  if (!q) return items;
  return items.filter((item) =>
    keys.some((key) => {
      const raw = readPath(item, key);
      if (raw == null) return false;
      return normalize(String(raw)).includes(q);
    }),
  );
}
