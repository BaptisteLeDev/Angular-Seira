import type { VideoSource } from 'expo-video';

// Vidéo de démonstration locale, affichée en fallback dès qu'aucune URL n'est
// fournie OU que la vraie source échoue (géré dans VideoPlayer), quel que soit
// l'environnement. Pour changer la vidéo : remplace simplement ce require.
export const FALLBACK_VIDEO_SOURCE = require('../../assets/videos/Rick Astley - Never Gonna Give You Up (Official Music Video).mp4');

export function resolveVideoSource(url: string | null | undefined): VideoSource {
  // Pas de vraie source → vidéo de démonstration.
  return url ? { uri: url } : FALLBACK_VIDEO_SOURCE;
}
