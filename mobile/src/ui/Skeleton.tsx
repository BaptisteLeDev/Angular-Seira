import { useEffect, useRef } from 'react';
import { Animated, type DimensionValue } from 'react-native';

export type SkeletonShape = 'rect' | 'circle';

type Props = {
  shape?: SkeletonShape;
  radius?: 'md' | 'lg' | 'xl';
  height?: DimensionValue;
  width?: DimensionValue;
};

/**
 * Squelette pulsé pour les états de chargement.
 * Anime l'opacité (les keyframes Tailwind `animate-pulse` ne passent pas sur RN).
 */
export function Skeleton({
  shape = 'rect',
  radius = 'lg',
  height = 16,
  width = '100%',
}: Props) {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  const radiusClass =
    shape === 'circle'
      ? 'rounded-full'
      : radius === 'md'
      ? 'squircle-md'
      : radius === 'xl'
      ? 'squircle-xl'
      : 'squircle-lg';

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={`bg-surface-container-high ghost-border ${radiusClass}`}
      style={{ opacity, height, width }}
    />
  );
}
