import type { Article, ContentType } from '@src/schemas/article.schema';
import type { IoniconName } from '@src/ui/Icon';

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
