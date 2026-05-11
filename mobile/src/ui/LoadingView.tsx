import { View, Text } from 'react-native';
import { Spinner } from './Spinner';

type Props = {
  label?: string;
};

export function LoadingView({ label = 'Chargement en cours...' }: Props) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLiveRegion="polite"
      className="flex-col items-center justify-center squircle-xl bg-surface-container p-10 ghost-border"
    >
      <Spinner size="lg" />
      <Text className="mt-4 font-headline text-lg font-bold text-on-surface">{label}</Text>
    </View>
  );
}
