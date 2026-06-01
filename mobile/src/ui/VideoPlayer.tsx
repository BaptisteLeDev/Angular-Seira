import { useEvent } from 'expo';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';

import { resolveVideoSource } from '@src/constants/video';
import { colors } from '@src/constants/theme';
import { Icon } from './Icon';

type Props = {
  url: string | null | undefined;
};

const LOCKED_RATE = 1;

export function VideoPlayer({ url }: Props) {
  const source = resolveVideoSource(url);
  const videoRef = useRef<VideoView>(null);

  const player = useVideoPlayer(source, (p) => {
    p.loop = false;
    p.playbackRate = LOCKED_RATE;
    p.timeUpdateEventInterval = 0.5;
  });

  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });
  const { currentTime } = useEvent(player, 'timeUpdate', {
    currentTime: 0,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    bufferedPosition: 0,
  });

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

  // Anti-seek inline : si currentTime saute (l'utilisateur a quand même réussi
  // à scrubber via les contrôles natifs en fullscreen), on revient à la
  // dernière position connue. Tolère un delta normal d'update.
  const lastTimeRef = useRef(0);
  useEffect(() => {
    const last = lastTimeRef.current;
    const delta = currentTime - last;
    if (delta > 1.5) {
      player.currentTime = last;
      return;
    }
    lastTimeRef.current = currentTime;
  }, [currentTime, player]);

  if (!source) {
    return (
      <View className="items-center squircle-xl bg-surface-container-low p-6 ghost-border">
        <Icon name="videocam-off-outline" size={28} color={colors.onSurfaceVariant} />
        <Text className="mt-2 font-mono text-xs text-on-surface-variant">
          Vidéo indisponible
        </Text>
      </View>
    );
  }

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
