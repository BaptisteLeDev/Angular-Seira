import { forwardRef, useCallback } from 'react';
import { Pressable, type PressableProps, type View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type HapticTone = 'selection' | 'light' | 'medium' | 'success';

type Props = PressableProps & {
  haptic?: HapticTone | false;
  scaleTo?: number;
};

const SPRING = { damping: 18, stiffness: 220, mass: 0.7 } as const;

function trigger(tone: HapticTone) {
  switch (tone) {
    case 'selection':
      return Haptics.selectionAsync();
    case 'light':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    case 'medium':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    case 'success':
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

/**
 * Pressable with spring scale + haptic feedback. The standard tap surface
 * for the app — use everywhere instead of plain Pressable for buttons.
 */
export const HapticPressable = forwardRef<View, Props>(function HapticPressable(
  { haptic = 'light', scaleTo = 0.97, onPressIn, onPressOut, onPress, style, ...rest },
  ref,
) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleIn = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
      scale.value = withSpring(scaleTo, SPRING);
      onPressIn?.(e);
    },
    [scale, scaleTo, onPressIn],
  );

  const handleOut = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
      scale.value = withSpring(1, SPRING);
      onPressOut?.(e);
    },
    [scale, onPressOut],
  );

  const handlePress = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
      if (haptic) void trigger(haptic);
      onPress?.(e);
    },
    [haptic, onPress],
  );

  return (
    <AnimatedPressable
      ref={ref}
      onPressIn={handleIn}
      onPressOut={handleOut}
      onPress={handlePress}
      style={[animatedStyle, style as never]}
      {...rest}
    />
  );
});
