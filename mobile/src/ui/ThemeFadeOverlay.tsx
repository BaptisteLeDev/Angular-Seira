import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useThemeStore } from '@src/stores/theme.store';
import { getPalette } from '@src/constants/theme';

const FADE_MS = 280;

/**
 * Full-screen overlay that briefly tints the screen with the new background
 * color when the theme changes, fading out over ~280ms. RN can't animate
 * background-color across an entire tree (no CSS transitions), so we fake a
 * cross-fade by flashing through the destination color.
 *
 * Mount as a sibling of the app content, inside a positioned ancestor
 * (e.g. SafeAreaProvider in the root layout). Non-interactive.
 */
export function ThemeFadeOverlay() {
  const effective = useThemeStore((s) => s.effective);
  const opacity = useSharedValue(0);
  const color = useSharedValue(getPalette(effective).background);
  const prev = useRef(effective);

  useEffect(() => {
    if (prev.current === effective) return;
    prev.current = effective;

    color.value = getPalette(effective).background;
    opacity.value = 1;
    opacity.value = withTiming(0, {
      duration: FADE_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [effective, color, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    backgroundColor: color.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, style]}
    />
  );
}
