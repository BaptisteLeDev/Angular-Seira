import type { VideoSource } from 'expo-video';

import { ENV } from './env';

// Toggle pour remplacer toutes les vidéos par la vidéo locale en dev.
// Mets à false pour utiliser les vraies URLs de formation.
export const USE_DEV_VIDEO = true;

// Vidéo locale utilisée comme placeholder en dev.
// Pour changer la vidéo dev : remplace simplement ce require.
const DEV_VIDEO_SOURCE = require('../../assets/videos/Rick Astley - Never Gonna Give You Up (Official Music Video).mp4');

export function resolveVideoSource(url: string | null | undefined): VideoSource | null {
  if (ENV.isDev && USE_DEV_VIDEO) return DEV_VIDEO_SOURCE;
  if (!url) return null;
  return { uri: url };
}
