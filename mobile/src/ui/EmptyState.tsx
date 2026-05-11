import { View, Text } from 'react-native';
import { Icon, type IoniconName } from './Icon';

type Props = {
  icon: IoniconName;
  title: string;
  description?: string;
  iconColor?: string;
};

export function EmptyState({ icon, title, description, iconColor = '#a1a1aa' }: Props) {
  return (
    <View
      className="flex-col items-center justify-center squircle-xl bg-surface-container p-10 ghost-border"
      accessibilityRole="summary"
    >
      <Icon name={icon} size={48} color={iconColor} />
      <Text className="mt-4 font-headline text-lg font-bold text-on-surface text-center">
        {title}
      </Text>
      {description ? (
        <Text className="mt-2 max-w-md text-sm text-on-surface-variant text-center">
          {description}
        </Text>
      ) : null}
    </View>
  );
}
