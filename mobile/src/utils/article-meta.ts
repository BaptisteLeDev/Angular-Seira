import type { Article, ContentType } from '@src/schemas/article.schema';
import type { IoniconName } from '@src/ui/Icon';

/**
 * Identité stable d'un item de leçon pour le routage. Les items vidéo (ressource
 * Video) et les ChapterContent ont des `id` issus de tables différentes qui
 * peuvent entrer en collision : on préfixe (`v` vidéo / `c` contenu) pour lever
 * toute ambiguïté de clé React et de navigation.
 */
export function articleKey(article: Pick<Article, 'id' | 'videoId'>): string {
  return `${article.videoId != null ? 'v' : 'c'}${article.id}`;
}

export function articleDurationMin(article: Article): number | null {
  if (typeof article.durationSeconds !== 'number') return null;
  return Math.max(1, Math.round(article.durationSeconds / 60));
}

export function contentTypeIcon(type: ContentType | string): IoniconName {
  switch (type) {
    case 'video': return 'play-circle-outline';
    case 'pdf': return 'document-outline';
    case 'markdown': return 'document-text-outline';
    case 'link': return 'link-outline';
    case 'file': return 'attach-outline';
    default: return 'document-outline';
  }
}

export function contentTypeLabel(type: ContentType | string): string {
  switch (type) {
    case 'video': return 'Vidéo';
    case 'pdf': return 'PDF';
    case 'markdown': return 'Article';
    case 'link': return 'Lien';
    case 'file': return 'Fichier';
    default: return 'Contenu';
  }
}
