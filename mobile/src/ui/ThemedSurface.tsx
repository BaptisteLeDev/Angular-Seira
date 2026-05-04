import { View, type ViewProps } from 'react-native';

type Props = ViewProps & {
  /** Visual elevation. `flat` = no border. `card` = surface + border. `inset` = container low. */
  variant?: 'flat' | 'card' | 'inset' | 'highlight';
  radius?: 'md' | 'lg' | 'xl' | '2xl' | '3xl';
};

const VARIANT: Record<NonNullable<Props['variant']>, string> = {
  flat: '',
  card: 'bg-surface-container ghost-border',
  inset: 'bg-surface-container-low',
  highlight: 'bg-surface-container-high ghost-border',
};

const RADIUS: Record<NonNullable<Props['radius']>, string> = {
  md: 'squircle-md',
  lg: 'squircle-lg',
  xl: 'squircle-xl',
  '2xl': 'squircle-2xl',
  '3xl': 'squircle-3xl',
};

/**
 * Standard container. Use this instead of raw <View> for any card-like surface
 * to keep elevation language consistent across the app.
 */
export function ThemedSurface({
  variant = 'card',
  radius = 'xl',
  className,
  ...rest
}: Props) {
  return (
    <View
      className={`${RADIUS[radius]} ${VARIANT[variant]} ${className ?? ''}`}
      {...rest}
    />
  );
}
