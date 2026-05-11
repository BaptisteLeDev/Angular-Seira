import { ActivityIndicator } from 'react-native';

export type SpinnerSize = 'sm' | 'md' | 'lg';
export type SpinnerTone = 'primary' | 'on-surface' | 'on-primary' | 'error';

type Props = {
  size?: SpinnerSize;
  tone?: SpinnerTone;
  label?: string;
  className?: string;
};

const TONE_COLOR: Record<SpinnerTone, string> = {
  primary: '#7bd0ff',
  'on-surface': '#fafafa',
  'on-primary': '#041c27',
  error: '#f87171',
};

/**
 * Spinner basé sur l'ActivityIndicator natif d'Expo/RN,
 * styled via Uniwind (className) + couleur via prop `color`.
 */
export function Spinner({
  size = 'md',
  tone = 'primary',
  label = 'Chargement en cours',
  className,
}: Props) {
  return (
    <ActivityIndicator
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      size={size === 'sm' ? 'small' : 'large'}
      color={TONE_COLOR[tone]}
      className={className}
    />
  );
}
