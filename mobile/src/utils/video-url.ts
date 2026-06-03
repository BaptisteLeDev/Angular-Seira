/**
 * Détecte une URL YouTube (watch / youtu.be / embed / shorts) et renvoie
 * l'URL d'embed correspondante, ou null si ce n'est pas du YouTube.
 *
 * expo-video ne sait pas lire une URL YouTube : il faut l'afficher dans une
 * WebView via l'embed. Les autres URLs (mp4 direct, etc.) restent gérées par
 * le lecteur natif.
 */
export function youtubeEmbedUrl(url: string | null | undefined): string | null {
  const id = youtubeVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

/** Extrait l'identifiant (11 caractères) d'une URL YouTube, ou null. */
export function youtubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}
