import type { Article, ContentType } from '../../core/schemas/article.schema';

export function articleDurationMin(article: Article): number | null {
  if (typeof article.durationSeconds !== 'number') return null;
  return Math.max(1, Math.round(article.durationSeconds / 60));
}

/** Classe utilitaire heroicons à appliquer sur un span (icon-[heroicons--xxx]). */
export function contentTypeIcon(type: ContentType | string): string {
  switch (type) {
    case 'video':
      return 'icon-[heroicons--play-circle]';
    case 'pdf':
      return 'icon-[heroicons--document]';
    case 'markdown':
      return 'icon-[heroicons--document-text]';
    case 'link':
      return 'icon-[heroicons--link]';
    case 'file':
      return 'icon-[heroicons--paper-clip]';
    default:
      return 'icon-[heroicons--document]';
  }
}

export function contentTypeLabel(type: ContentType | string): string {
  switch (type) {
    case 'video':
      return 'Vidéo';
    case 'pdf':
      return 'PDF';
    case 'markdown':
      return 'Article';
    case 'link':
      return 'Lien';
    case 'file':
      return 'Fichier';
    default:
      return 'Contenu';
  }
}
