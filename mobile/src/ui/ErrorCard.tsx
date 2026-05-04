import { View, Text } from 'react-native';

type Props = {
  title?: string;
  message: string;
};

export function ErrorCard({ title = 'Erreur de chargement', message }: Props) {
  return (
    <View
      accessibilityRole="alert"
      className="squircle-xl bg-error-container p-5 ghost-border"
      style={{ borderColor: 'rgba(248,113,113,0.5)' }}
    >
      <Text className="font-headline text-lg font-bold text-on-error-container">{title}</Text>
      <Text className="mt-2 text-sm text-on-error-container">{message}</Text>
    </View>
  );
}
