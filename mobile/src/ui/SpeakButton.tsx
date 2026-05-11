import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@src/constants/theme';
import { stripMarkdown } from '@src/utils/strip-markdown';
import { Icon } from './Icon';

type Props = {
  text: string;
  isMarkdown?: boolean;
  language?: string;
  rate?: number;
  pitch?: number;
  label?: string;
  compact?: boolean;
};

type State = 'idle' | 'speaking' | 'paused';

export function SpeakButton({
  text,
  isMarkdown = false,
  language = 'fr-FR',
  rate = 1,
  pitch = 1,
  label = 'Écouter',
  compact = false,
}: Props) {
  const [state, setState] = useState<State>('idle');

  useEffect(() => {
    return () => {
      void Speech.stop();
    };
  }, []);

  const start = () => {
    const payload = isMarkdown ? stripMarkdown(text) : text;
    if (!payload) return;
    setState('speaking');
    Speech.speak(payload, {
      language,
      rate,
      pitch,
      onDone: () => setState('idle'),
      onStopped: () => setState('idle'),
      onError: () => setState('idle'),
    });
  };

  const pause = async () => {
    await Speech.pause();
    setState('paused');
  };

  const resume = async () => {
    await Speech.resume();
    setState('speaking');
  };

  const stop = async () => {
    await Speech.stop();
    setState('idle');
  };

  const onPrimary = () => {
    if (state === 'idle') return start();
    if (state === 'speaking') return void pause();
    return void resume();
  };

  const primaryIcon =
    state === 'speaking' ? 'pause' : state === 'paused' ? 'play' : 'volume-high-outline';
  const primaryLabel =
    state === 'speaking' ? 'Pause' : state === 'paused' ? 'Reprendre' : label;

  if (compact) {
    return (
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={onPrimary}
          accessibilityRole="button"
          accessibilityLabel={primaryLabel}
          className="size-9 items-center justify-center squircle-md bg-primary"
        >
          <Icon name={primaryIcon} size={16} color={colors.onPrimary} />
        </Pressable>
        {state !== 'idle' ? (
          <Pressable
            onPress={() => void stop()}
            accessibilityRole="button"
            accessibilityLabel="Arrêter la lecture"
            className="size-9 items-center justify-center squircle-md bg-surface-container-high"
          >
            <Icon name="stop" size={16} color={colors.onSurface} />
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-2">
      <Pressable
        onPress={onPrimary}
        accessibilityRole="button"
        accessibilityLabel={primaryLabel}
        className="flex-row items-center gap-2 squircle-lg bg-primary px-4 py-2.5"
      >
        <Icon name={primaryIcon} size={16} color={colors.onPrimary} />
        <Text className="font-headline text-sm font-bold text-on-primary">
          {primaryLabel}
        </Text>
      </Pressable>
      {state !== 'idle' ? (
        <Pressable
          onPress={() => void stop()}
          accessibilityRole="button"
          accessibilityLabel="Arrêter la lecture"
          className="flex-row items-center gap-2 squircle-lg bg-surface-container-high px-3 py-2.5 ghost-border"
        >
          <Icon name="stop" size={14} color={colors.onSurface} />
          <Text className="font-headline text-xs font-bold text-on-surface">Stop</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
