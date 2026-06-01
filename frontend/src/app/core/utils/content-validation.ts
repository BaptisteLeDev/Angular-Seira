import type { ContentType } from '../schemas/article.schema';

/** Champ obligatoire selon le type de contenu (null si aucun). */
export function requiredFieldByType(
  type: ContentType,
): 'content' | 'sourceUrl' | 'filePath' | null {
  switch (type) {
    case 'markdown':
      return 'content';
    case 'video':
    case 'link':
      return 'sourceUrl';
    case 'pdf':
    case 'file':
      return 'filePath';
    default:
      return null;
  }
}

/**
 * Vrai si le contenu requis par le type est renseigné.
 * Évite un 422 backend (markdown sans contenu, vidéo sans URL, pdf sans fichier).
 */
export function isContentPayloadValid(
  type: ContentType,
  fields: { content?: string | null; sourceUrl?: string | null; filePath?: string | null },
): boolean {
  const required = requiredFieldByType(type);
  if (!required) return true;
  return (fields[required] ?? '').trim().length > 0;
}
