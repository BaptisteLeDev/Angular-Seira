import { useEvent } from 'expo';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { FALLBACK_VIDEO_SOURCE, resolveVideoSource } from '@src/constants/video';
import { colors } from '@src/constants/theme';
import { useProgressStore } from '@src/stores/progress.store';
import { useWatchSessionStore } from '@src/stores/watch-session.store';
import { clampPercent, computeCap, deriveStatus } from '@src/utils/video-progress';
import { youtubeEmbedUrl } from '@src/utils/video-url';
import { Icon } from './Icon';

type Props = {
  url: string | null | undefined;
  videoId?: number | null;
};

const LOCKED_RATE = 1;

/**
 * Aiguillage : un lien YouTube ne se lit pas avec expo-video → WebView d'embed.
 * Toute autre source (mp4 direct, fallback) passe par le lecteur natif.
 */
export function VideoPlayer({ url, videoId }: Props) {
  const embedUrl = youtubeEmbedUrl(url);
  if (embedUrl) {
    return <YoutubeEmbed embedUrl={embedUrl} />;
  }
  return <NativeVideoPlayer url={url} videoId={videoId} />;
}

function YoutubeEmbed({ embedUrl }: { embedUrl: string }) {
  return (
    <View className="overflow-hidden squircle-xl bg-black ghost-border">
      <WebView
        source={{ uri: embedUrl }}
        style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' }}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction
      />
    </View>
  );
}

function NativeVideoPlayer({ url, videoId }: Props) {
  const videoRef = useRef<VideoView>(null);

  const trackSegment = useWatchSessionStore((s) => s.track);
  const resetWatch = useWatchSessionStore((s) => s.reset);

  // Si la vraie source échoue, on bascule sur la vidéo de démonstration locale.
  const [useFallback, setUseFallback] = useState(false);
  useEffect(() => {
    setUseFallback(false);
    if (videoId != null) resetWatch(videoId);
  }, [url, videoId, resetWatch]);

  const source = useFallback ? FALLBACK_VIDEO_SOURCE : resolveVideoSource(url);

  const player = useVideoPlayer(source, (p) => {
    p.loop = false;
    p.playbackRate = LOCKED_RATE;
    p.timeUpdateEventInterval = 0.5;
  });

  const { status } = useEvent(player, 'statusChange', { status: player.status });
  useEffect(() => {
    if (status === 'error' && !useFallback) {
      setUseFallback(true);
    }
  }, [status, useFallback]);

  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });
  const { currentTime } = useEvent(player, 'timeUpdate', {
    currentTime: 0,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    bufferedPosition: 0,
  });

  const trackingEnabled = videoId != null && !useFallback;
  const report = useProgressStore((s) => s.report);
  const hydrate = useProgressStore((s) => s.hydrate);
  const savedSeconds = useProgressStore((s) =>
    videoId != null ? (s.byVideoId[videoId]?.watchedSeconds ?? 0) : 0,
  );

  const capRef = useRef(0);
  const lastSentRef = useRef(0);
  const resumedRef = useRef(false);
  // Dernière durée connue (le player natif est libéré au démontage : flush()
  // doit lire cette ref, jamais player.duration, sous peine de crash
  // "shared object already released").
  const durationRef = useRef(0);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!trackingEnabled) return;
    const duration = player.duration || 0;
    if (resumedRef.current || duration <= 0) return;
    if (savedSeconds > 0 && savedSeconds < duration - 1) {
      player.currentTime = savedSeconds;
      capRef.current = savedSeconds;
    }
    resumedRef.current = true;
  }, [trackingEnabled, savedSeconds, currentTime, player]);

  const flush = useCallback(() => {
    if (!trackingEnabled || videoId == null) return;
    // Lecture via ref uniquement : ne JAMAIS toucher `player` ici (peut être
    // appelé depuis le cleanup de démontage, après libération native).
    const duration = durationRef.current;
    if (duration <= 0) return;
    const cap = capRef.current;
    if (cap <= lastSentRef.current) return;
    lastSentRef.current = cap;
    const percent = clampPercent((cap / duration) * 100);
    void report(videoId, {
      watchedSecondsValidated: Math.floor(cap),
      completionPercent: percent,
      status: deriveStatus(percent),
      lastSeenAt: new Date().toISOString(),
    });
  }, [trackingEnabled, videoId, report]);

  // Verrouillage vitesse à 1x (en mode inline ; les contrôles natifs en
  // fullscreen permettent quand même de changer la vitesse, on ne peut pas
  // l'empêcher avec l'API expo-video).
  useEffect(() => {
    const sub = player.addListener('playbackRateChange', ({ playbackRate }) => {
      if (playbackRate !== LOCKED_RATE) {
        player.playbackRate = LOCKED_RATE;
      }
    });
    return () => sub.remove();
  }, [player]);

  // Anti-skip PAR DÉFAUT (indépendant du backend) : on bloque l'avance rapide
  // au-delà de la position vue (`cap`). Le plafond monte en lecture continue ;
  // une fois la vidéo vue jusqu'au bout (cap ≈ durée), tout seek redevient
  // libre (computeCap n'a plus rien à bloquer). Désactivé sur la vidéo de démo.
  useEffect(() => {
    if (useFallback) return;
    if (player.duration > 0) durationRef.current = player.duration;
    const before = capRef.current;
    const next = computeCap(before, currentTime);
    if (next === before && currentTime > before + 1) {
      player.currentTime = before;
      return;
    }
    capRef.current = next;
    // L'envoi serveur reste conditionné au tracking (videoId) via flush().
    if (Math.floor(next) - lastSentRef.current >= 8) {
      flush();
    }
    // Visionnage certifié (clés temporelles), piloté par le plafond vu.
    if (trackingEnabled && videoId != null && durationRef.current > 0) {
      void trackSegment(videoId, next, durationRef.current);
    }
  }, [currentTime, player, useFallback, flush, trackingEnabled, videoId, trackSegment]);

  // Envois finaux : pause, fin de lecture, démontage.
  useEffect(() => {
    if (!trackingEnabled) return;
    if (!isPlaying) flush();
  }, [isPlaying, trackingEnabled, flush]);

  useEffect(() => {
    const sub = player.addListener('playToEnd', () => {
      if (player.duration > 0) durationRef.current = player.duration;
      capRef.current = durationRef.current || capRef.current;
      flush();
    });
    return () => sub.remove();
  }, [player, flush]);

  useEffect(() => {
    return () => {
      flush();
    };
  }, [flush]);

  const duration = player.duration || 0;
  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  return (
    <View className="overflow-hidden squircle-xl bg-black ghost-border">
      <VideoView
        ref={videoRef}
        style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' }}
        player={player}
        nativeControls={false}
        // En fullscreen natif, expo-video gère lui-même la rotation paysage
        // et le retour. C'est plus fiable qu'un Modal custom.
        fullscreenOptions={{
          enable: true,
          orientation: 'landscape',
          autoExitOnRotate: true,
        }}
        allowsPictureInPicture={false}
        contentFit="contain"
      />

      <View className="flex-row items-center gap-3 bg-surface-container-low px-4 py-3">
        <Pressable
          onPress={() => (isPlaying ? player.pause() : player.play())}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Mettre en pause' : 'Lire'}
          className="size-10 items-center justify-center squircle-lg bg-primary"
        >
          <Icon name={isPlaying ? 'pause' : 'play'} size={18} color={colors.onPrimary} />
        </Pressable>

        <View className="flex-1">
          <View
            className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest"
            accessibilityRole="progressbar"
            accessibilityValue={{ now: Math.round(progress * 100), min: 0, max: 100 }}
          >
            <View
              className="h-full rounded-full bg-primary"
              style={{ width: `${progress * 100}%` }}
            />
          </View>
        </View>

        <Text className="font-mono text-[11px] text-on-surface-variant">
          {formatTime(currentTime)} / {formatTime(duration)}
        </Text>

        <Pressable
          onPress={() => videoRef.current?.enterFullscreen()}
          accessibilityRole="button"
          accessibilityLabel="Plein écran"
          className="size-9 items-center justify-center squircle-md bg-surface-container-high"
          hitSlop={6}
        >
          <Icon name="expand-outline" size={16} color={colors.onSurface} />
        </Pressable>
      </View>
    </View>
  );
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
